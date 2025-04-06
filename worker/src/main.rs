use std::{convert::Infallible, pin::pin, time::Duration};

use llm_proxy::{dispatcher::Dispatcher, router::picker::RouterPicker};
use reqwest::Client;
use tokio::net::TcpListener;
use tower::{Service, ServiceBuilder, ServiceExt, steer::Steer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    tracing_subscriber::registry()
    .with(
        tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            // axum logs rejections from built-in extractors with the `axum::rejection`
            // target, at `TRACE` level. `axum::rejection=trace` enables showing those events
            format!(
                "{}=debug,tower_http=debug,axum::rejection=trace",
                env!("CARGO_CRATE_NAME")
            )
            .into()
        }),
    )
    .with(tracing_subscriber::fmt::layer())
    .init();


    let server = hyper_util::server::conn::auto::Builder::new(
        hyper_util::rt::TokioExecutor::new(),
    );
    let graceful = hyper_util::server::graceful::GracefulShutdown::new();
    let mut ctrl_c = pin!(tokio::signal::ctrl_c());
    tracing::info!("server started");
    

    loop {
        tokio::select! {
            conn = listener.accept() => {
                let (stream, peer_addr) = match conn {
                    Ok(conn) => conn,
                    Err(e) => {
                        tracing::error!("accept error: {}", e);
                        continue;
                    }
                };
                let stream = hyper_util::rt::TokioIo::new(Box::pin(stream));
                let conn = server.serve_connection_with_upgrades(stream, hyper::service::service_fn(|req| async move {
                        tracing::info!("got request");
                        let config = llm_proxy::types::config::WorkerConfig::default();
                        let mut services = Vec::new();
                        for (provider, _url) in config.dispatcher.provider_urls.iter() {
                            let dispatcher = Dispatcher::new(Client::new(), provider.clone());
                            services.push(dispatcher);
                        }
                        let service = Steer::new(services, RouterPicker);

                        let mut service_stack = ServiceBuilder::new()
                            .layer(llm_proxy::router::request_context::Layer)
                            // other middleware: rate limiting, logging, etc, etc
                            .service(service);

                        let response = service_stack
                            .ready()
                            .await
                            .unwrap()
                            .call(req)
                            .await
                            .unwrap();

                        tracing::info!("sending response");
                        Ok::<_, Infallible>(response)
                    }));

                let conn = graceful.watch(conn.into_owned());

                tokio::spawn(async move {
                    if let Err(err) = conn.await {
                        tracing::error!("connection error: {}", err);
                    }
                    tracing::info!("connection dropped: {}", peer_addr);
                });
            },

            _ = ctrl_c.as_mut() => {
                drop(listener);
                tracing::info!("Ctrl-C received, starting shutdown");
                    break;
            }
        }
    }

    tokio::select! {
        _ = graceful.shutdown() => {
            tracing::info!("Gracefully shutdown!");
        },
        _ = tokio::time::sleep(Duration::from_secs(10)) => {
            tracing::info!("Waited 10 seconds for graceful shutdown, aborting...");
        }
    }

    Ok(())
}
