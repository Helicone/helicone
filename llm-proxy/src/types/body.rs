use bytes::Bytes;
use tokio::sync::mpsc::Sender;

pub struct Body<B> 
where B: hyper::body::Body,
{
    pub body: B,
    pub sender: Sender<Bytes>,
}

