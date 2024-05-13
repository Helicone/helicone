--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1 (Ubuntu 15.1-1.pgdg20.04+1)
-- Dumped by pg_dump version 15.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: organization; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization (id, created_at, name, owner, is_personal, soft_delete, color, icon, has_onboarded, stripe_customer_id, stripe_subscription_id, subscription_status, tier, referral, size, organization_type, reseller_id, logo_path, limits, org_provider_key, domain, percent_to_log, stripe_subscription_item_id) FROM stdin;
83635a30-5ba6-41a8-8cc6-fb7df941b24a	2024-04-22 00:56:56.518623+00	Organization for Test	f76629c5-a070-4bbc-9918-64beaea48848	f	f	gray	building	t	\N	\N	\N	free	\N	\N	reseller	\N	\N	\N	\N	\N	100000	\N
a75d76e3-02e7-4d02-8a2b-c65ed27c69b2	2024-04-22 00:56:56.518623+00	Organization for Demo	d9064bb5-1501-4ec9-bfee-21ab74d645b8	f	f	gray	building	t	\N	\N	\N	free	\N	\N	reseller	\N	\N	\N	\N	\N	100000	\N
\.


--
-- Data for Name: alert; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alert (id, org_id, metric, threshold, time_window, time_block_duration, emails, status, name, soft_delete, created_at, updated_at, minimum_request_count) FROM stdin;
\.


--
-- Data for Name: alert_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alert_history (id, org_id, alert_id, alert_start_time, alert_end_time, alert_metric, alert_name, triggered_value, status, soft_delete, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: helicone_api_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.helicone_api_keys (created_at, api_key_hash, api_key_name, user_id, id, soft_delete, organization_id) FROM stdin;
2024-04-22 00:56:56.518623+00	014c02f17208d4f521b0bad39a1d0174e015e86f925cbbcc25108ffea74fd7f2	Test	f76629c5-a070-4bbc-9918-64beaea48848	1	f	83635a30-5ba6-41a8-8cc6-fb7df941b24a
2024-04-22 00:56:56.518623+00	4a6ced8c61492670cfd56f31e6e4c40e7cf8c6b88b7ab0a70efc5f86c136b9c3	Demo	d9064bb5-1501-4ec9-bfee-21ab74d645b8	2	f	a75d76e3-02e7-4d02-8a2b-c65ed27c69b2
\.


--
-- Data for Name: provider_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provider_keys (id, org_id, provider_name, provider_key_name, vault_key_id, soft_delete, created_at, provider_key, key_id, nonce) FROM stdin;
\.


--
-- Data for Name: helicone_proxy_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.helicone_proxy_keys (id, org_id, provider_key_id, helicone_proxy_key, helicone_proxy_key_name, soft_delete, created_at, experiment_use) FROM stdin;
\.


--
-- Data for Name: prompt; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prompt (created_at, prompt, name, id, auth_hash) FROM stdin;
\.


--
-- Data for Name: request; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.request (id, created_at, body, path, auth_hash, user_id, prompt_id, properties, formatted_prompt_id, prompt_values, helicone_api_key_id, helicone_user, helicone_org_id, provider, helicone_proxy_key_id, model, model_override, threat, target_url, request_ip, country_code, version) FROM stdin;
7566b7bb-1ad0-479c-945a-2a6297180e6e	2024-04-22 03:44:06.714+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": " My asdfdasdsdafsadfadsfads  My InpsdsutsssApplsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		\N	Testy3	{"Helicone-Prompt-Input-test": "My Inpsdsutsss", "Helicone-Prompt-Input-test2": "My asdfdasd"}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
42f20772-321c-41f5-8bd0-ab10705bcc96	2024-04-22 03:50:49.425+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": " My dsaasdfdasdsdafsadfasadfsdfdsfads  My InpsdsutsssApplsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		\N	Testy3	{"Helicone-Prompt-Input-test": "My Inpsdsutsss", "Helicone-Prompt-Input-test2": "My dsaasdfdasd"}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
162d7cac-f267-4da7-bbbe-74d3644df314	2024-04-22 06:28:34.391+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
3dbfb990-67c9-49f3-9560-f391793ea8d3	2024-04-22 06:28:45.852+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
cf978d2b-e2cd-414e-97cc-6a5b79071c30	2024-04-22 06:29:20.67+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
3f313d92-d0ff-4b0a-bb9c-1ca97c6e235c	2024-04-22 06:30:21.623+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
e7cb9de4-5495-40a6-b84c-b43204ef4e6b	2024-04-22 06:31:02.108+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
ffec6fc5-4c6c-4061-8f83-9bbb4e9c5171	2024-04-22 06:31:34.134+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
4d36a4bd-2dc2-42a9-8dd2-8599a7bff6c6	2024-04-22 06:31:36.536+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
11ed9c6a-2e15-4647-a923-38d6c2494926	2024-04-22 06:31:38.375+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
cb3105c4-00c3-485e-956b-2d68a0b47956	2024-04-22 06:31:39.464+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
5bfafe50-d98e-4d69-a55f-748b1da8f462	2024-04-22 06:31:41.558+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
72a97328-0b8b-4368-a76c-64e9c9c7231d	2024-04-22 06:31:42.526+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
9f730780-ed71-400e-9d76-19d265c7a908	2024-04-22 06:31:46.914+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
fb32d53e-dae3-426e-b5a2-b3005fe7e79f	2024-04-22 06:31:54.354+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
99dcc92a-ebb8-4db7-93a9-575834cdddb8	2024-04-22 06:31:55.941+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
5e6e5187-bef1-453c-b469-3f54cb32706a	2024-04-22 06:32:22.683+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
e9565d54-ff3f-4ebf-b7a3-06a9e43ea637	2024-04-22 06:32:24.218+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
a2fa6b68-afb6-4e37-b9d3-d6522c7d9ab3	2024-04-22 06:32:26.122+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
e1384e38-ed90-4b55-862f-43262a7ecdf4	2024-04-22 06:32:30.155+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
35645069-a9fc-4a09-b027-a3aa5e5705e9	2024-04-22 06:32:32.165+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
2092607e-e4a7-4502-aa87-ca81d310831a	2024-04-22 06:32:34.513+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
f218291c-321c-40c0-9c43-53c306d3da9e	2024-04-22 06:32:35.882+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
35fb7220-3937-4675-abe1-8b5938d98a31	2024-04-22 06:32:40.884+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
c102da99-f380-4be5-90aa-9bc4866851be	2024-04-22 06:32:55.018+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
012d98fe-6327-45a6-b28a-e34d04e9699c	2024-04-22 06:33:08.909+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
44c14b18-34a3-4b9d-8d20-737290b037ad	2024-04-22 06:33:10.521+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
b81b9b96-5eb7-4c62-9b5b-ad6f0e26c79a	2024-04-22 06:33:12.029+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
3702f8b6-f222-44b7-afa7-c8a44e711860	2024-04-22 06:33:12.989+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
193a5a9d-1f57-4152-87eb-225e40105883	2024-04-22 06:33:14.152+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
70639af9-3e8c-4be2-b38c-6e2cf6c1147b	2024-04-22 06:33:15.297+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
3a0cb3ec-612f-4cfd-9db1-5e6476ae4f6a	2024-04-22 06:33:16.362+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
38b589c3-308d-4ef5-8565-24028c390265	2024-04-22 06:33:17.555+00	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-3.5-turbo	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
0b41b5e4-2f72-4387-9ba0-96344b612b30	2024-04-22 06:33:31.079+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
f4dd24dc-a17a-4d99-83be-4a95d0d87713	2024-04-22 06:33:33.715+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
db83d696-09cd-41f1-be89-0d7055fa700c	2024-04-22 06:33:36.285+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
4715c179-c05c-4af8-80e2-2eafc3e087f7	2024-04-22 06:33:41.153+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
c953ce4d-0002-49d8-a52c-c45fdedef0a0	2024-04-22 06:34:03.989+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
e61fc52c-86b9-4e15-82f2-b98a455c28df	2024-04-22 06:34:59.934+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
3bc5bfd2-b303-43a8-ab2a-9830e401b91a	2024-04-22 06:35:16.914+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
f938afc5-5308-4056-a498-d947cf9d9ac3	2024-04-22 06:36:22.673+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
ac7803b7-5cde-47e8-b2d0-5211313b5def	2024-04-22 06:36:32.012+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
ae4581f1-18e4-499f-b9bd-52b2ce9892b5	2024-04-22 06:38:05.721+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
05cd87f9-4737-4992-b729-b76acf290d63	2024-04-22 06:41:50.39+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
8522a94d-3e48-437b-b6b2-044d5c26a262	2024-04-22 06:43:01.179+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
ccf6b9d1-a170-456c-9352-27375410e3cc	2024-04-22 06:43:03.597+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
79017f37-d8c1-48e3-8711-0d60162e7444	2024-04-22 06:43:07.118+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
cf8d90de-628d-43bf-8e60-c338b106567f	2024-04-22 06:43:13.346+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
3c62320b-7a85-4b8c-bae5-cda8c0089ee0	2024-04-22 06:43:15.718+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
ec35f8d9-45a3-4457-a3f7-3fe6954e1b89	2024-04-22 06:43:35.538+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
a210e51e-9d8f-441a-b053-40deadfb7b80	2024-04-22 06:44:12.805+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
c176f9a8-0ccc-4028-a41a-d5d89a8c2f7b	2024-04-22 06:44:41.049+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
a022f9c7-1ee0-4f5c-8c88-a71b3e662f23	2024-04-22 06:44:43.162+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
35ef0143-35c9-4eb4-ad84-65179f4f932e	2024-04-22 06:44:49.488+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
fefc9aac-bb0c-49cf-9908-a7a5c05ab0a3	2024-04-22 06:44:54.401+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
8d2de6bf-c2c1-4c6a-9d16-e4d5b8a595cc	2024-04-22 06:44:57.474+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
ef7d973f-6338-449a-ba25-7ea7a4f75960	2024-04-22 06:44:59.289+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
06823901-5602-45e1-a4e9-b255885174f9	2024-04-22 06:45:01.919+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
ccaa7e0d-79c7-4b21-9f58-ff46428b0ecf	2024-04-22 06:45:05.622+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
268f56c6-f837-44e7-b753-71d90278300a	2024-04-22 06:46:52.013+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
77215744-ee9e-4fd3-ac96-f70c90eb46ac	2024-04-22 06:47:22.178+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
abe284fc-8567-46ab-9224-8f7a70e1238c	2024-04-22 07:20:39.131+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
6cf5b418-141d-4f34-9e67-a099b01f750c	2024-04-22 07:20:59.907+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
a0ca3eb7-29ba-4e22-8421-a2269bc06084	2024-04-22 07:21:16.9+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
8dfa352e-6ee4-47ea-a664-9cb46f303528	2024-04-22 07:22:43.584+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
7f73b159-2f4c-4ecc-a8cf-30f500a26122	2024-04-22 07:25:52.296+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
ee4745d9-ee8b-46e2-bc94-3626cf1cdbd5	2024-04-22 07:25:59.517+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
e6ff9781-4c23-4c56-a0b6-d53e204df3fb	2024-04-22 07:26:20.114+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
8b1a68f9-8b1a-419a-a945-90e04e45a11c	2024-04-22 07:26:24.077+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
654da587-94da-433f-a33f-fd761568ccc4	2024-04-22 07:28:54.742+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
f820e15e-b8b6-4861-8db2-5fe2f8e2b481	2024-04-22 07:29:03.222+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
9cd704cc-8549-40e4-8636-d0e20ddd54bf	2024-04-22 07:29:17.017+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
6a6e8a0a-ee28-41de-a28d-9ad213ad6c3e	2024-04-22 07:29:19.124+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
b9a47ec9-15fd-41f4-88c2-91173ae5b611	2024-04-22 07:29:21.008+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
30f140e1-33f6-4c5c-b794-8c27f5864881	2024-04-22 07:29:23.35+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
3ebd8f46-99fd-4b77-a231-67d32c541685	2024-04-22 07:29:25.32+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
641e9b8e-abb8-4f97-abaf-3e34129b54b1	2024-04-22 07:32:14.457+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
7f52a184-3c7e-4e75-866d-57c10f017649	2024-04-22 07:32:18.775+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		j	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
85d9c056-350f-47f4-b226-daeac4ff5b8a	2024-04-22 20:41:26.382+00	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" > My asdfdasd</helicone-prompt-input>sdafsadfadsfads <helicone-prompt-input key=\\"test\\" > My Inpsdsutsss</helicone-prompt-input>Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		\N	\N	{}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
eb6073a8-93c7-4f73-910a-c23a7dcc9888	2024-04-22 20:41:52.827+00	{"model": "gpt-4", "messages": [{"role": "system", "content": " My asdfdasdsdafsadfadsfads  My InpsdsutsssApplsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		\N	Testy3	{"Helicone-Prompt-Input-test": "My Inpsdsutsss", "Helicone-Prompt-Input-test2": "My asdfdasd"}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
b8b0331a-68b9-431e-ad50-4067b50dcb27	2024-04-22 20:41:57.759+00	{"model": "gpt-4", "messages": [{"role": "system", "content": " My asdfdasdsdafsadfadsfads  My InpsdsutsssApplsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		\N	Testy3	{"Helicone-Prompt-Input-test": "My Inpsdsutsss", "Helicone-Prompt-Input-test2": "My asdfdasd"}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
f06a4b33-fd59-42bd-912d-3680c1a3e1fd	2024-04-22 20:42:30.236+00	{"model": "gpt-4", "messages": [{"role": "system", "content": " My asdfdasdsdafsadfadsfads  My InpsdsutsssApplsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		\N	Testy3	{"Helicone-Prompt-Input-test": "My Inpsdsutsss", "Helicone-Prompt-Input-test2": "My asdfdasd"}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
c9f6cf10-3325-47dd-9af7-55c5e6866f86	2024-04-22 20:46:47.213+00	{"model": "gpt-4", "messages": [{"role": "system", "content": " My asdfdasdsdafsadfadsfads  My InpsdsutsssApplsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		\N	Testy3	{"Helicone-Prompt-Id": "Testy3", "Helicone-Prompt-Input-test": "My Inpsdsutsss", "Helicone-Prompt-Input-test2": "My asdfdasd"}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
f8f502e5-ac47-46ab-a05e-1c5f43987941	2024-04-22 20:46:59.696+00	{"model": "gpt-4", "messages": [{"role": "system", "content": " My asdfdasdsdafsadfadsfads  My InpsdsutsssApplsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		\N	Testy3	{"Helicone-Prompt-Id": "Testy3", "Helicone-Prompt-Input-test": "My Inpsdsutsss", "Helicone-Prompt-Input-test2": "My asdfdasd"}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
fd378cc1-6616-42f9-92d8-72769144c9d3	2024-04-22 20:47:27.737+00	{"model": "gpt-4", "messages": [{"role": "system", "content": " My asdfdasdsdafsadfadsfads  My InpsdsutsssApplsadfsade sausadfsacdsfeasdfsda!!!!"}]}	http://localhost:8787/v1/chat/completions		\N	Testy3	{"Helicone-Prompt-Id": "Testy3", "Helicone-Prompt-Input-test": "My Inpsdsutsss", "Helicone-Prompt-Input-test2": "My asdfdasd"}	\N	\N	1	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	OPENAI	\N	gpt-4	\N	\N	https://api.openai.com/v1/chat/completions	\N	US	0
\.


--
-- Data for Name: asset; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset (id, request_id, organization_id, created_at) FROM stdin;
\.


--
-- Data for Name: cache_hits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cache_hits (created_at, request_id, organization_id) FROM stdin;
\.


--
-- Data for Name: contact_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_submissions (id, created_at, first_name, last_name, email_address, company_name, company_description, tag) FROM stdin;
\.


--
-- Data for Name: experiment_dataset; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.experiment_dataset (id, created_at, organization_id) FROM stdin;
\.


--
-- Data for Name: experiment_dataset_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.experiment_dataset_v2 (id, created_at, name, organization) FROM stdin;
deb37ff9-803c-4ab6-8bf1-b84837b4935f	2024-04-22 04:05:06.968806+00	testRandom	83635a30-5ba6-41a8-8cc6-fb7df941b24a
b1ce8cf5-c3b5-4b8d-ae07-66e5c6e2b478	2024-04-22 23:17:37.736467+00	testRandom	83635a30-5ba6-41a8-8cc6-fb7df941b24a
\.


--
-- Data for Name: experiment_dataset_v2_row; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.experiment_dataset_v2_row (id, input_record, dataset_id, created_at) FROM stdin;
f9228b2a-e953-4ad3-963b-df0772d5b959	49f6d205-fb3a-4e65-b1a3-5c410cc5c66f	deb37ff9-803c-4ab6-8bf1-b84837b4935f	2024-04-22 04:05:07.03116+00
3df4ccf2-55b7-4875-b024-1b876afdf3ed	9dad822c-c21a-45d4-9d74-de574fb098d4	deb37ff9-803c-4ab6-8bf1-b84837b4935f	2024-04-22 04:05:07.03116+00
97139cc3-cc62-4b9f-a4e8-d9bf5762bd1f	dca3539f-84db-4156-8a3e-b6c2f302d9df	b1ce8cf5-c3b5-4b8d-ae07-66e5c6e2b478	2024-04-22 23:17:37.763111+00
d79fb1f5-ae13-4512-bb16-6e8f7be7f56b	9dad822c-c21a-45d4-9d74-de574fb098d4	b1ce8cf5-c3b5-4b8d-ae07-66e5c6e2b478	2024-04-22 23:17:37.763111+00
e77ac62e-af8b-4f8c-b2f4-59e8a6935bca	abf703d3-4896-4e3c-af44-e7399011dd39	b1ce8cf5-c3b5-4b8d-ae07-66e5c6e2b478	2024-04-22 23:17:37.763111+00
0dc413aa-88af-4ef5-9625-d384c6660cf7	ef1c8400-3d44-482a-92f1-de3e47714d3d	b1ce8cf5-c3b5-4b8d-ae07-66e5c6e2b478	2024-04-22 23:17:37.763111+00
94a45779-17f2-475a-bbe7-c87d7299cbf5	e33e6d1b-0e92-4469-8e8f-f46785dba999	b1ce8cf5-c3b5-4b8d-ae07-66e5c6e2b478	2024-04-22 23:17:37.763111+00
c1a85ac1-0002-4961-ba3d-1bc20a48d6b5	dce547c3-2bdb-4462-b479-887768ae2ad8	b1ce8cf5-c3b5-4b8d-ae07-66e5c6e2b478	2024-04-22 23:17:37.763111+00
a3497034-fa8c-4bc2-a940-6bfad2551a0c	75219c1d-dbbc-4e6c-a64c-3b64eb46abe4	b1ce8cf5-c3b5-4b8d-ae07-66e5c6e2b478	2024-04-22 23:17:37.763111+00
27bd6524-8eef-4a9d-9f41-aae21e6d85b7	49f6d205-fb3a-4e65-b1a3-5c410cc5c66f	b1ce8cf5-c3b5-4b8d-ae07-66e5c6e2b478	2024-04-22 23:17:37.763111+00
\.


--
-- Data for Name: experiment_dataset_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.experiment_dataset_values (id, created_at, dataset_id, request_id, result_request_id) FROM stdin;
\.


--
-- Data for Name: experiment_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.experiment_v2 (id, dataset, organization, created_at) FROM stdin;
1f10e8be-08ea-4bee-9ca1-1a37d1ff0e5a	b1ce8cf5-c3b5-4b8d-ae07-66e5c6e2b478	83635a30-5ba6-41a8-8cc6-fb7df941b24a	2024-04-22 23:18:32.233504+00
c246bff2-7d0c-49aa-8b8e-498aa645e923	b1ce8cf5-c3b5-4b8d-ae07-66e5c6e2b478	83635a30-5ba6-41a8-8cc6-fb7df941b24a	2024-04-22 23:34:44.129575+00
4cba968a-0df8-4ede-b648-aa6e1493840a	b1ce8cf5-c3b5-4b8d-ae07-66e5c6e2b478	83635a30-5ba6-41a8-8cc6-fb7df941b24a	2024-04-22 23:34:52.61306+00
\.


--
-- Data for Name: prompt_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prompt_v2 (id, user_defined_id, description, pretty_name, organization, soft_delete, created_at) FROM stdin;
da5864da-d9c7-4a2e-bbdb-f507d03605fc	Testy3	\N	\N	83635a30-5ba6-41a8-8cc6-fb7df941b24a	f	2024-04-22 03:44:08.060979+00
\.


--
-- Data for Name: prompts_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prompts_versions (id, major_version, minor_version, soft_delete, helicone_template, prompt_v2, model, organization, created_at) FROM stdin;
58196b14-a20d-4755-a67f-a740138273d6	0	0	f	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" />sdafsadfadsfads <helicone-prompt-input key=\\"test\\" />Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	da5864da-d9c7-4a2e-bbdb-f507d03605fc	gpt-3.5-turbo	83635a30-5ba6-41a8-8cc6-fb7df941b24a	2024-04-22 03:44:08.069291+00
68e6987c-8ace-49e0-b71f-8422010f43b8	1	0	f	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" />sdafsadfasadfsdfdsfads <helicone-prompt-input key=\\"test\\" />Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	da5864da-d9c7-4a2e-bbdb-f507d03605fc	gpt-3.5-turbo	83635a30-5ba6-41a8-8cc6-fb7df941b24a	2024-04-22 03:50:50.291472+00
a41d6e1f-23e1-46d2-8e10-2137944f397b	0	1	f	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" />sdafsadfadsfads <helicone-prompt-input key=\\"test\\" />Applsadfslaksdjlfd!"}]}	da5864da-d9c7-4a2e-bbdb-f507d03605fc		83635a30-5ba6-41a8-8cc6-fb7df941b24a	2024-04-22 04:06:54.604323+00
5a2c4b98-8d9d-467b-88e5-9198987a9cef	2	0	f	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" />sdafsadfadsfads <helicone-prompt-input key=\\"test\\" />Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	da5864da-d9c7-4a2e-bbdb-f507d03605fc	gpt-4	83635a30-5ba6-41a8-8cc6-fb7df941b24a	2024-04-22 20:41:53.697354+00
59fa44d5-7bc1-421c-9730-ac73a40b6bc2	0	2	f	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" />sdafsadfadsfads <helicone-prompt-input key=\\"test\\" />Applsadfslaksdjlfd!"}]}	da5864da-d9c7-4a2e-bbdb-f507d03605fc		83635a30-5ba6-41a8-8cc6-fb7df941b24a	2024-04-22 23:18:32.210859+00
c1b95c28-9ab8-4edf-ab95-a380e1ceaccf	0	3	f	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" />sdafsadfadsfads <helicone-prompt-input key=\\"test\\" />Applsadfslaksdjlfd!"}]}	da5864da-d9c7-4a2e-bbdb-f507d03605fc		83635a30-5ba6-41a8-8cc6-fb7df941b24a	2024-04-22 23:34:52.594195+00
\.


--
-- Data for Name: experiment_v2_hypothesis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.experiment_v2_hypothesis (id, prompt_version, model, status, experiment_v2, created_at) FROM stdin;
e4fc1182-21b9-4c84-b2b8-cffe20cab296	59fa44d5-7bc1-421c-9730-ac73a40b6bc2	gpt-3.5-turbo	PENDING	1f10e8be-08ea-4bee-9ca1-1a37d1ff0e5a	2024-04-22 23:18:32.248827+00
f650177f-2a1b-496b-9e20-d282084952eb	c1b95c28-9ab8-4edf-ab95-a380e1ceaccf	gpt-3.5-turbo	PENDING	4cba968a-0df8-4ede-b648-aa6e1493840a	2024-04-22 23:34:52.629218+00
\.


--
-- Data for Name: experiment_v2_hypothesis_run; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.experiment_v2_hypothesis_run (id, experiment_hypothesis, dataset_row, created_at) FROM stdin;
\.


--
-- Data for Name: prompts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prompts (id, created_at, description, "heliconeTemplate", status, version, organization_id, name, soft_delete, is_experiment, uuid) FROM stdin;
Testy3	2024-04-22 03:44:08.086108+00	\N	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" />sdafsadfadsfads <helicone-prompt-input key=\\"test\\" />Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	active	0	83635a30-5ba6-41a8-8cc6-fb7df941b24a	\N	f	f	03c18ff5-988c-4799-8511-ec94adcee26a
Testy3	2024-04-22 03:50:50.31176+00	\N	{"model": "gpt-3.5-turbo", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" />sdafsadfasadfsdfdsfads <helicone-prompt-input key=\\"test\\" />Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	active	1	83635a30-5ba6-41a8-8cc6-fb7df941b24a	\N	f	f	2475af3e-4620-4763-9d33-9e5be1a6bece
Testy3	2024-04-22 20:41:53.711751+00	\N	{"model": "gpt-4", "messages": [{"role": "system", "content": "<helicone-prompt-input key=\\"test2\\" />sdafsadfadsfads <helicone-prompt-input key=\\"test\\" />Applsadfsade sausadfsacdsfeasdfsda!!!!"}]}	active	2	83635a30-5ba6-41a8-8cc6-fb7df941b24a	\N	f	f	fd1f1bf3-e1dd-4bfb-bfe3-8a7f52591fae
\.


--
-- Data for Name: experiments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.experiments (id, name, created_at, origin_prompt, test_prompt, dataset, status, organization_id, provider_key, result_dataset) FROM stdin;
\.


--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feature_flags (id, created_at, org_id, feature) FROM stdin;
\.


--
-- Data for Name: response; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.response (id, created_at, body, request, delay_ms, status, completion_tokens, prompt_tokens, feedback, model, time_to_first_token) FROM stdin;
dce055ac-8255-4063-aae6-4bf0324582b2	2024-04-22 03:44:06.714+00	{}	7566b7bb-1ad0-479c-945a-2a6297180e6e	-1	-2	\N	\N	\N	\N	\N
a2097934-6105-4e61-8278-4357a99f4210	2024-04-22 03:50:49.425+00	{}	42f20772-321c-41f5-8bd0-ab10705bcc96	-1	-2	\N	\N	\N	\N	\N
46d7613f-22a8-4c7d-a23d-95c52eab7190	2024-04-22 06:28:34.391+00	{}	162d7cac-f267-4da7-bbbe-74d3644df314	-1	-2	\N	\N	\N	\N	\N
0e07dc52-45e0-4d23-bc45-8a416886e31e	2024-04-22 06:28:45.852+00	{}	3dbfb990-67c9-49f3-9560-f391793ea8d3	-1	-2	\N	\N	\N	\N	\N
a95b6574-481d-427c-b1c6-c94c50dab30d	2024-04-22 06:29:20.67+00	{}	cf978d2b-e2cd-414e-97cc-6a5b79071c30	-1	-2	\N	\N	\N	\N	\N
9f8cdd39-f4e0-4645-93ce-dcdb479db3d1	2024-04-22 06:30:21.623+00	{}	3f313d92-d0ff-4b0a-bb9c-1ca97c6e235c	-1	-2	\N	\N	\N	\N	\N
26ccc372-759d-4377-bd10-3b1895291576	2024-04-22 06:31:03.201+00	{"id": "chatcmpl-9GhUcWHDEyK95p8FZIeGVZyRWOcYm", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 110, "prompt_tokens": 76, "completion_tokens": 34}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I see that you have entered two prompts: \\"My asdfdasd\\" and \\"My Inpsdsutsss\\". How can I assist you with these inputs?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767462, "system_fingerprint": "fp_c2295e73ad"}	e7cb9de4-5495-40a6-b84c-b43204ef4e6b	1135	200	34	76	\N	gpt-3.5-turbo-0125	\N
769d497f-ada8-4926-86c1-ae7e80f49ac4	2024-04-22 06:31:35.165+00	{"id": "chatcmpl-9GhV8VgMqRNGmALQ4PvXehjYKImmh", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 105, "prompt_tokens": 76, "completion_tokens": 29}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sure! Here is the updated text with your inputs:\\n\\nMy asdfdasd sdafsadfadsfads My Inputsss Applesauce!!!!"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767494, "system_fingerprint": "fp_c2295e73ad"}	ffec6fc5-4c6c-4061-8f83-9bbb4e9c5171	1048	200	29	76	\N	gpt-3.5-turbo-0125	\N
2879657c-f849-44dc-9c10-ba90bd0dac4c	2024-04-22 06:31:37.34+00	{"id": "chatcmpl-9GhVAW9j7YFk92229PC8roA11PdO4", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 111, "prompt_tokens": 76, "completion_tokens": 35}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I see that you have entered \\"My Input\\" for the first prompt and \\" My Inputsss\\" for the second prompt. How can I assist you further with this information?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767496, "system_fingerprint": "fp_c2295e73ad"}	4d36a4bd-2dc2-42a9-8dd2-8599a7bff6c6	805	200	35	76	\N	gpt-3.5-turbo-0125	\N
33e0f84c-08dc-4585-8ca6-698cc706ea1e	2024-04-22 06:31:38.915+00	{"id": "chatcmpl-9GhVCpWTVwWdlX677pBvLBITRySQi", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 92, "prompt_tokens": 76, "completion_tokens": 16}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Thanks for providing your inputs. How can I assist you further with this information?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767498, "system_fingerprint": "fp_c2295e73ad"}	11ed9c6a-2e15-4647-a923-38d6c2494926	542	200	16	76	\N	gpt-3.5-turbo-0125	\N
243020de-ee3c-4aed-827a-e7cc3fc51d85	2024-04-22 06:31:40.751+00	{"id": "chatcmpl-9GhVDkSbM8CVrVHGQR4WJSylefSQC", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 125, "prompt_tokens": 76, "completion_tokens": 49}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I see that you have entered two prompt inputs: \\"My asdfdasd\\" with the key \\"test2\\" and \\"My Inpsdsutsss\\" with the key \\"test\\". How can I assist you further with this information?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767499, "system_fingerprint": "fp_c2295e73ad"}	cb3105c4-00c3-485e-956b-2d68a0b47956	1288	200	49	76	\N	gpt-3.5-turbo-0125	\N
5fc03545-1768-40e7-a687-d28a3f0fb10c	2024-04-22 06:31:42.499+00	{"id": "chatcmpl-9GhVFAy3SE8dqyJQw87kckFvvq1Wp", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 112, "prompt_tokens": 76, "completion_tokens": 36}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I see that you have entered \\"My Inpsdsutsss\\" and \\"My asdfdasd\\" as your inputs. How can I assist you further with this information?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767501, "system_fingerprint": "fp_c2295e73ad"}	5bfafe50-d98e-4d69-a55f-748b1da8f462	942	200	36	76	\N	gpt-3.5-turbo-0125	\N
f97b9770-4277-4a22-a878-b25a1a096513	2024-04-22 06:31:43.646+00	{"id": "chatcmpl-9GhVGUlDnYpaKzQJ7xsohPN4CNqr0", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 106, "prompt_tokens": 76, "completion_tokens": 30}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I see you have entered some text surrounded by the `<helicone-prompt-input>` tags. What would you like me to do with this input?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767502, "system_fingerprint": "fp_c2295e73ad"}	72a97328-0b8b-4368-a76c-64e9c9c7231d	1121	200	30	76	\N	gpt-3.5-turbo-0125	\N
279e164a-dc04-4a26-a74d-4f01d07a49fd	2024-04-22 06:31:47.316+00	{"id": "chatcmpl-9GhVKlqFrGKrMH4DYelRiJgXuISOl", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 90, "prompt_tokens": 76, "completion_tokens": 14}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Thanks for providing your input! How can I assist you further today?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767506, "system_fingerprint": "fp_c2295e73ad"}	9f730780-ed71-400e-9d76-19d265c7a908	405	200	14	76	\N	gpt-3.5-turbo-0125	\N
01b5a372-0703-4efe-b9e5-cb7e2efcba1b	2024-04-22 06:31:55.277+00	{"id": "chatcmpl-9GhVSoLC9TOU8pYYex81i1d0K4U3X", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 101, "prompt_tokens": 76, "completion_tokens": 25}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I see that you have entered some text along with Helicone input components. How can I assist you further with this content?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767514, "system_fingerprint": "fp_c2295e73ad"}	fb32d53e-dae3-426e-b5a2-b3005fe7e79f	924	200	25	76	\N	gpt-3.5-turbo-0125	\N
74f1c3cb-9a0b-4fb6-b47b-bb9ccefe5611	2024-04-22 06:31:56.435+00	{"id": "chatcmpl-9GhVU6Nz2jfbtUSyQm38iZipKB4qh", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 91, "prompt_tokens": 76, "completion_tokens": 15}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm here to help! How can I assist you with your inputs?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767516, "system_fingerprint": "fp_c2295e73ad"}	99dcc92a-ebb8-4db7-93a9-575834cdddb8	495	200	15	76	\N	gpt-3.5-turbo-0125	\N
63a78964-e026-489f-8d3b-7f4ed479ef50	2024-04-22 06:32:24.153+00	{"id": "chatcmpl-9GhVuT68qHnCnRgS9PSLU9KC6uCxA", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 124, "prompt_tokens": 76, "completion_tokens": 48}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Thanks for providing the inputs \\"My asdfdasd\\" and \\"My Inpsdsutsss\\"! It seems like you have a mix of words and random characters in your message. How can I assist you further with this information?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767542, "system_fingerprint": "fp_c2295e73ad"}	5e6e5187-bef1-453c-b469-3f54cb32706a	1482	200	48	76	\N	gpt-3.5-turbo-0125	\N
117896e2-a3ed-420d-ad73-32fa400d1481	2024-04-22 06:32:25.667+00	{"id": "chatcmpl-9GhVwlRxEZivPuORtVUWFzudbOCUm", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 150, "prompt_tokens": 76, "completion_tokens": 74}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sure! It seems like you have inserted two \\"helicone-prompt-input\\" elements in your text. The first one has the key \\"test2\\" with the content \\"My asdfdasd\\", and the second one has the key \\"test\\" with the content \\"My Inpsdsutsss\\".\\n\\nDo you need any assistance with these inputs or anything else?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767544, "system_fingerprint": "fp_c2295e73ad"}	e9565d54-ff3f-4ebf-b7a3-06a9e43ea637	1450	200	74	76	\N	gpt-3.5-turbo-0125	\N
d01ab3b6-e4e0-44c1-b6d6-35baa7ee6def	2024-04-22 06:32:26.696+00	{"id": "chatcmpl-9GhVyVvSMavUfSuCaeHMdHhvmaa2l", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 100, "prompt_tokens": 76, "completion_tokens": 24}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Just to confirm, you entered \\"My Inpsdsutsss\\" as the input for the prompt key \\"test\\"?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767546, "system_fingerprint": "fp_c2295e73ad"}	a2fa6b68-afb6-4e37-b9d3-d6522c7d9ab3	575	200	24	76	\N	gpt-3.5-turbo-0125	\N
683cfcbe-e038-464c-a4b2-80b42b2617c9	2024-04-22 06:32:31.301+00	{"id": "chatcmpl-9GhW2NqBkXiGNcFRmU5WEDPQkg0iE", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 107, "prompt_tokens": 76, "completion_tokens": 31}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I see you have made a typo in the first prompt. Did you mean to write \\"My Input\\"? Please confirm so I can provide the correct response."}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767550, "system_fingerprint": "fp_c2295e73ad"}	e1384e38-ed90-4b55-862f-43262a7ecdf4	1148	200	31	76	\N	gpt-3.5-turbo-0125	\N
2615b50a-4842-405a-b9b9-1df8bf0066af	2024-04-22 06:32:33.488+00	{"id": "chatcmpl-9GhW4sbMfoqAZGf6UAfPB1zbxXEee", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 125, "prompt_tokens": 76, "completion_tokens": 49}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Your inputs have been recorded as:\\n1. test2: My asdfdasd\\n2. test: My Inpsdsutsss\\n\\nThank you for providing that information! Is there anything else you would like to input or ask about?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767552, "system_fingerprint": "fp_c2295e73ad"}	35645069-a9fc-4a09-b027-a3aa5e5705e9	1325	200	49	76	\N	gpt-3.5-turbo-0125	\N
68915e81-c99d-4808-bf6d-1867fa9764df	2024-04-22 06:32:35.447+00	{"id": "chatcmpl-9GhW66hGpejrBGfh4x7ujVfr5jawo", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 116, "prompt_tokens": 76, "completion_tokens": 40}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I see that you have entered \\"My Inpsdsutsss\\" as well as \\"My asdfdasd\\" in the text. Is there anything else you would like to add or modify?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767554, "system_fingerprint": "fp_c2295e73ad"}	2092607e-e4a7-4502-aa87-ca81d310831a	935	200	40	76	\N	gpt-3.5-turbo-0125	\N
1c045e4e-293e-4861-bfd0-f25f1d31a52a	2024-04-22 06:32:36.5+00	{"id": "chatcmpl-9GhW8p179r9AVpm7DIcuQFuZ245OF", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 90, "prompt_tokens": 76, "completion_tokens": 14}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Thanks for providing your input! What would you like to do next?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767556, "system_fingerprint": "fp_c2295e73ad"}	f218291c-321c-40c0-9c43-53c306d3da9e	619	200	14	76	\N	gpt-3.5-turbo-0125	\N
04e9b0da-9529-490a-b482-53aa19e354be	2024-04-22 06:32:41.426+00	{"id": "chatcmpl-9GhWCcw807YVsqLoBbWqsgSRs1Jze", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 92, "prompt_tokens": 76, "completion_tokens": 16}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Thanks for providing your inputs! How can I assist you further with this information?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767560, "system_fingerprint": "fp_c2295e73ad"}	35fb7220-3937-4675-abe1-8b5938d98a31	543	200	16	76	\N	gpt-3.5-turbo-0125	\N
80906bbf-436e-40e9-97f4-ede18bbdd396	2024-04-22 06:32:55.931+00	{"id": "chatcmpl-9GhWRBzGQy80pCMJ72J1IwPtny2Ai", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 107, "prompt_tokens": 76, "completion_tokens": 31}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Thanks for providing your input. What would you like assistance with regarding your inputs \\"My asdfdasd\\" and \\"My Inpsdsutsss\\"?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767575, "system_fingerprint": "fp_c2295e73ad"}	c102da99-f380-4be5-90aa-9bc4866851be	927	200	31	76	\N	gpt-3.5-turbo-0125	\N
d586b18f-7a8c-46d8-b54f-e8aaf25bd6a3	2024-04-22 06:33:09.802+00	{"id": "chatcmpl-9GhWfBR0cJRVXJZ6YYQ2ErFxNYF21", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 107, "prompt_tokens": 76, "completion_tokens": 31}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Thanks for providing your input! How can I assist you today with your inputs \\"My asdfdasd\\" and \\"My Inpsdsutsss\\"?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767589, "system_fingerprint": "fp_c2295e73ad"}	012d98fe-6327-45a6-b28a-e34d04e9699c	897	200	31	76	\N	gpt-3.5-turbo-0125	\N
ee4dd4f8-939c-4baf-947b-056cf0929361	2024-04-22 06:33:11.625+00	{"id": "chatcmpl-9GhWgHeDMCYcSMCuZzm11zSppTKQP", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 119, "prompt_tokens": 76, "completion_tokens": 43}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Thank you for providing your input! It looks like you've entered \\"My Inpsdsutsss\\" and \\"My asdfdasd\\" as your inputs. How can I assist you further with this information?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767590, "system_fingerprint": "fp_c2295e73ad"}	44c14b18-34a3-4b9d-8d20-737290b037ad	1106	200	43	76	\N	gpt-3.5-turbo-0125	\N
6e13c14d-e359-4326-8ec7-a980eb182444	2024-04-22 06:33:12.736+00	{"id": "chatcmpl-9GhWi8SNBqfwkDnFHEU5NqklbyvHa", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 92, "prompt_tokens": 76, "completion_tokens": 16}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Thanks for providing your inputs! How can I assist you further with these inputs?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767592, "system_fingerprint": "fp_c2295e73ad"}	b81b9b96-5eb7-4c62-9b5b-ad6f0e26c79a	708	200	16	76	\N	gpt-3.5-turbo-0125	\N
d2f27998-995a-43ac-94cd-137f50d16f0f	2024-04-22 06:33:13.722+00	{"id": "chatcmpl-9GhWjSQeoj3sYccZC1e0uund2VPNa", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 99, "prompt_tokens": 76, "completion_tokens": 23}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I see that you have entered some text with prompt inputs. What would you like me to do with this input?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767593, "system_fingerprint": "fp_c2295e73ad"}	3702f8b6-f222-44b7-afa7-c8a44e711860	734	200	23	76	\N	gpt-3.5-turbo-0125	\N
3d284e47-7942-48cb-9b3c-fb4d251dd293	2024-04-22 06:33:15.033+00	{"id": "chatcmpl-9GhWk0arPq4pA0kX0TbAPYaBCbAI8", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 108, "prompt_tokens": 76, "completion_tokens": 32}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I see that you have entered some text along with prompt inputs. How can I assist you further with \\"My asdfdasd\\" and \\"My Inputs\\"?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767594, "system_fingerprint": "fp_c2295e73ad"}	193a5a9d-1f57-4152-87eb-225e40105883	882	200	32	76	\N	gpt-3.5-turbo-0125	\N
1f7fb665-44bd-4d8f-ab77-d1f6bff6c7d6	2024-04-22 06:33:15.92+00	{"id": "chatcmpl-9GhWlkySVtvCuhsb8zddhFoi2R2VS", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 99, "prompt_tokens": 76, "completion_tokens": 23}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sure, I see that you have entered some text with placeholder inputs. How can I assist you with this content?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767595, "system_fingerprint": "fp_c2295e73ad"}	70639af9-3e8c-4be2-b38c-6e2cf6c1147b	624	200	23	76	\N	gpt-3.5-turbo-0125	\N
977069a5-a457-407b-bd58-188931b76b3d	2024-04-22 06:33:17.181+00	{"id": "chatcmpl-9GhWmH17wFpJl0GQctLJ6Bgpqw1SP", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 108, "prompt_tokens": 76, "completion_tokens": 32}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I see that you entered \\"My asdfdasd\\" and \\"My Inputs\\" in the prompt inputs. Let me know how I can assist you further!"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767596, "system_fingerprint": "fp_c2295e73ad"}	3a0cb3ec-612f-4cfd-9db1-5e6476ae4f6a	819	200	32	76	\N	gpt-3.5-turbo-0125	\N
6faaabe1-c3c5-4ed2-a7e3-0da49ed9d8b2	2024-04-22 06:33:19.83+00	{"id": "chatcmpl-9GhWntyImqCvh5GjDUqjQcOxf1nev", "model": "gpt-3.5-turbo-0125", "usage": {"total_tokens": 115, "prompt_tokens": 76, "completion_tokens": 39}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Just to clarify, are you saying that your input for \\"test2\\" is \\"My asdfdasd\\" and your input for \\"test\\" is \\"My Inpsdsutsss\\"?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767597, "system_fingerprint": "fp_c2295e73ad"}	38b589c3-308d-4ef5-8565-24028c390265	2280	200	39	76	\N	gpt-3.5-turbo-0125	\N
52bb0303-27ed-4e17-b959-1e37321d8223	2024-04-22 06:33:32.642+00	{"id": "chatcmpl-9GhX1ig3uyxtJ9I0fq3aj5xhLqw45", "model": "gpt-4-0613", "usage": {"total_tokens": 103, "prompt_tokens": 76, "completion_tokens": 27}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, but I'm having trouble understanding what you're trying to say. Could you please rephrase or provide more context?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767611, "system_fingerprint": null}	0b41b5e4-2f72-4387-9ba0-96344b612b30	1566	200	27	76	\N	gpt-4-0613	\N
80b8d0cc-5a83-4f1c-bc68-c4fcfd150361	2024-04-22 06:33:35.422+00	{"id": "chatcmpl-9GhX3a29UkOX6FmUt1eugSkBAMpjm", "model": "gpt-4-0613", "usage": {"total_tokens": 105, "prompt_tokens": 76, "completion_tokens": 29}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, your query is a bit unclear. Could you please rephrase it or provide more details so that I can assist you better?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767613, "system_fingerprint": null}	f4dd24dc-a17a-4d99-83be-4a95d0d87713	1708	200	29	76	\N	gpt-4-0613	\N
4da80b25-bf6d-4a1b-95c3-1adf6daf297b	2024-04-22 06:33:38.887+00	{"id": "chatcmpl-9GhX6BGL4S8gYrPgvXgZuu6ImCQs8", "model": "gpt-4-0613", "usage": {"total_tokens": 110, "prompt_tokens": 76, "completion_tokens": 34}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "It appears you are typing a lot of gibberish or non-words. If you need help with something, could you please clarify or make your request more understandable?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767616, "system_fingerprint": null}	db83d696-09cd-41f1-be89-0d7055fa700c	2605	200	34	76	\N	gpt-4-0613	\N
9e96787c-b8f8-4211-ade8-43ce5b78196d	2024-04-22 06:33:42.84+00	{"id": "chatcmpl-9GhXBkdOfXnDIfEE2YzKa5M8KRkjK", "model": "gpt-4-0613", "usage": {"total_tokens": 100, "prompt_tokens": 76, "completion_tokens": 24}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, your message is quite unclear. Please make sure to write complete sentences and use proper grammar to ensure clear communication."}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767621, "system_fingerprint": null}	4715c179-c05c-4af8-80e2-2eafc3e087f7	1688	200	24	76	\N	gpt-4-0613	\N
680a1aaa-baee-46cb-bc78-c45e8b170252	2024-04-22 06:34:06.691+00	{"id": "chatcmpl-9GhXYAsnnR0vnQKl9NTC8rKvd4HCT", "model": "gpt-4-0613", "usage": {"total_tokens": 108, "prompt_tokens": 76, "completion_tokens": 32}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry for any confusion, but the text you provided is difficult to understand. Could you please clarify or provide more context so I can assist you better?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767644, "system_fingerprint": null}	c953ce4d-0002-49d8-a52c-c45fdedef0a0	2702	200	32	76	\N	gpt-4-0613	\N
63432f2b-0c22-4802-9b4e-bcaf5154118f	2024-04-22 06:35:01.817+00	{"id": "chatcmpl-9GhYSxUjyjp3TUbduxFRtGWW8neXK", "model": "gpt-4-0613", "usage": {"total_tokens": 97, "prompt_tokens": 76, "completion_tokens": 21}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm having difficulty understanding your request. Could you please provide more details or clarify what you're asking?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767700, "system_fingerprint": null}	e61fc52c-86b9-4e15-82f2-b98a455c28df	1884	200	21	76	\N	gpt-4-0613	\N
f40eda42-c367-4178-95f0-4778c557d21e	2024-04-22 06:35:18.51+00	{"id": "chatcmpl-9GhYjM9r0t21fVc4lWmIUtJQUKoMO", "model": "gpt-4-0613", "usage": {"total_tokens": 101, "prompt_tokens": 76, "completion_tokens": 25}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry but I'm unable to understand your input. Can you please provide more context or clarify your statement? Thanks!"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767717, "system_fingerprint": null}	3bc5bfd2-b303-43a8-ab2a-9830e401b91a	1596	200	25	76	\N	gpt-4-0613	\N
c2fa3b51-8a29-4516-8821-a2cfce4a667b	2024-04-22 06:36:25.1+00	{"id": "chatcmpl-9GhZmCCJ44RyFfMcaMtVP5QkMBzvr", "model": "gpt-4-0613", "usage": {"total_tokens": 104, "prompt_tokens": 76, "completion_tokens": 28}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, it seems like your text includes unfinished sentences and non-standard English words which makes it difficult to understand. Could you please refine it?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767782, "system_fingerprint": null}	f938afc5-5308-4056-a498-d947cf9d9ac3	2437	200	28	76	\N	gpt-4-0613	\N
61d6a938-0b54-4611-ab2c-f0613a5bea78	2024-04-22 06:36:33.831+00	{"id": "chatcmpl-9GhZwJyqhEdNI7MYjOQM0VKOQXE7A", "model": "gpt-4-0613", "usage": {"total_tokens": 108, "prompt_tokens": 76, "completion_tokens": 32}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, but the text provided is difficult to understand due to a large number of typing errors. Could you please rephrase it or provide more context?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767792, "system_fingerprint": null}	ac7803b7-5cde-47e8-b2d0-5211313b5def	1833	200	32	76	\N	gpt-4-0613	\N
6adb2a6d-c14c-4dfb-ab3e-eff0c3a0f0c2	2024-04-22 06:38:07.329+00	{"id": "chatcmpl-9GhbR7BssiqRJOjS3297mHeCFAiDp", "model": "gpt-4-0613", "usage": {"total_tokens": 102, "prompt_tokens": 76, "completion_tokens": 26}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, I didn't quite understand your input. Could you please provide more clear information in order for me to better assist you?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713767885, "system_fingerprint": null}	ae4581f1-18e4-499f-b9bd-52b2ce9892b5	1616	200	26	76	\N	gpt-4-0613	\N
e3dae5d5-a2da-4ff2-a0ec-32bff7bea761	2024-04-22 06:41:51.849+00	{"id": "chatcmpl-9Ghf4FA9W1rHS94cjwSC9gA8HRqp7", "model": "gpt-4-0613", "usage": {"total_tokens": 98, "prompt_tokens": 76, "completion_tokens": 22}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "It seems like this input is quite puzzling. Could you please provide a clearer question or prompt? Thanks!"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768110, "system_fingerprint": null}	05cd87f9-4737-4992-b729-b76acf290d63	1460	200	22	76	\N	gpt-4-0613	\N
3d46e571-9aad-4489-8872-a1c62cf6f838	2024-04-22 06:43:02.679+00	{"id": "chatcmpl-9GhgDZUREh8N8n1ydUdMuYMs0gguD", "model": "gpt-4-0613", "usage": {"total_tokens": 95, "prompt_tokens": 76, "completion_tokens": 19}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, I couldn't understand your input. Can you please provide more specific or clear information?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768181, "system_fingerprint": null}	8522a94d-3e48-437b-b6b2-044d5c26a262	1505	200	19	76	\N	gpt-4-0613	\N
50de2243-dd76-4dc2-8bb2-8a2e35487118	2024-04-22 06:43:05.11+00	{"id": "chatcmpl-9GhgFaqHNpfPu7E1pCU2oqKsUXJkg", "model": "gpt-4-0613", "usage": {"total_tokens": 97, "prompt_tokens": 76, "completion_tokens": 21}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, but I'm having trouble understanding your input. Could you please provide a clearer message?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768183, "system_fingerprint": null}	ccf6b9d1-a170-456c-9352-27375410e3cc	1514	200	21	76	\N	gpt-4-0613	\N
445e2efe-f574-4616-804a-fea61969a2da	2024-04-22 06:43:10.357+00	{"id": "chatcmpl-9GhgJHjjmKKaZjMF3hmwNcfOgsjTq", "model": "gpt-4-0613", "usage": {"total_tokens": 123, "prompt_tokens": 76, "completion_tokens": 47}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "It seems like you're trying to convey a message, but it's not very clear due to the inclusion of a lot of gibberish and unclear phrases. Could you please rephrase or explain further so I can assist you better?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768187, "system_fingerprint": null}	79017f37-d8c1-48e3-8711-0d60162e7444	3239	200	47	76	\N	gpt-4-0613	\N
d667cbc0-19ab-4608-ae58-b47172be93d3	2024-04-22 06:43:15.075+00	{"id": "chatcmpl-9GhgPdK3Oy4Obr26BpbbFU2Oehsuv", "model": "gpt-4-0613", "usage": {"total_tokens": 100, "prompt_tokens": 76, "completion_tokens": 24}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, but I might need more clarity to understand your input. Could you please rephrase it or provide more details?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768193, "system_fingerprint": null}	cf8d90de-628d-43bf-8e60-c338b106567f	1729	200	24	76	\N	gpt-4-0613	\N
89bc5a84-a5c1-458a-94ec-f27dc32bbaf9	2024-04-22 06:43:17.695+00	{"id": "chatcmpl-9GhgRHwCE6WMBv22TpC1vxyef1ZeC", "model": "gpt-4-0613", "usage": {"total_tokens": 104, "prompt_tokens": 76, "completion_tokens": 28}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "It seems your messages are scrambled and hard to understand. Could you please clarify your issues or questions, so that I can assist you better?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768195, "system_fingerprint": null}	3c62320b-7a85-4b8c-bae5-cda8c0089ee0	1977	200	28	76	\N	gpt-4-0613	\N
8c142ed0-9fca-4354-9bca-d359190dd8a8	2024-04-22 06:43:38.145+00	{"id": "chatcmpl-9GhglsGclAggOeUcDyhd93p9bhjV4", "model": "gpt-4-0613", "usage": {"total_tokens": 103, "prompt_tokens": 76, "completion_tokens": 27}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, but I'm unable to assist as your request is unclear. Could you please provide more information or clarify your request?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768215, "system_fingerprint": null}	ec35f8d9-45a3-4457-a3f7-3fe6954e1b89	2620	200	27	76	\N	gpt-4-0613	\N
20efa17c-b9d1-459e-9ae3-0aefe096fb6a	2024-04-22 06:44:14.623+00	{"id": "chatcmpl-9GhhNHlzJ9zehb1L8YpLcVsL1dSjw", "model": "gpt-4-0613", "usage": {"total_tokens": 100, "prompt_tokens": 76, "completion_tokens": 24}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, but it seems there are some typographical errors in the text. Could you please retype it?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768253, "system_fingerprint": null}	a210e51e-9d8f-441a-b053-40deadfb7b80	1840	200	24	76	\N	gpt-4-0613	\N
77d1c50b-8ea0-47a6-bb4d-f00f739571a9	2024-04-22 06:44:42.427+00	{"id": "chatcmpl-9GhhppKroAKIOjsFXtr06xKwmXxS3", "model": "gpt-4-0613", "usage": {"total_tokens": 96, "prompt_tokens": 76, "completion_tokens": 20}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, I didn't understand what you meant. Could you provide more context or clarify your message?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768281, "system_fingerprint": null}	c176f9a8-0ccc-4028-a41a-d5d89a8c2f7b	1403	200	20	76	\N	gpt-4-0613	\N
81e8ca92-3f9c-4777-a666-92fcc37f54e0	2024-04-22 06:44:44.726+00	{"id": "chatcmpl-9GhhrFZY6rzFkZkxToUyrjtOHwoxJ", "model": "gpt-4-0613", "usage": {"total_tokens": 100, "prompt_tokens": 76, "completion_tokens": 24}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "It seems you're typing in a nonsensical or encrypted string of characters. Can you provide more context or clarification?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768283, "system_fingerprint": null}	a022f9c7-1ee0-4f5c-8c88-a71b3e662f23	1565	200	24	76	\N	gpt-4-0613	\N
7053b1e5-1d5a-44b5-b967-7ce2827f4a7d	2024-04-22 06:44:52.342+00	{"id": "chatcmpl-9GhhxFtp4fAABYlQ8nNGCwuiMXniz", "model": "gpt-4-0613", "usage": {"total_tokens": 118, "prompt_tokens": 76, "completion_tokens": 42}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, but I'm unable to assist as your text is unclear. Could you please provide more information or point out exactly what you want to know or discuss? It will help me assist you better."}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768289, "system_fingerprint": null}	35ef0143-35c9-4eb4-ad84-65179f4f932e	2855	200	42	76	\N	gpt-4-0613	\N
0bfea9ae-d40c-4b32-8070-ed4f74a7402c	2024-04-22 06:44:56.786+00	{"id": "chatcmpl-9Ghi22eZkWbMjJaGeMtJi43AjTYuR", "model": "gpt-4-0613", "usage": {"total_tokens": 102, "prompt_tokens": 76, "completion_tokens": 26}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "It seems like you're typing in a jumbled manner. Could you please rephrase or clarify so I can assist you better?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768294, "system_fingerprint": null}	fefc9aac-bb0c-49cf-9908-a7a5c05ab0a3	2386	200	26	76	\N	gpt-4-0613	\N
efd49de7-b89c-42b6-b991-4bd1496c9df3	2024-04-22 06:44:58.878+00	{"id": "chatcmpl-9Ghi5eHxImfWlJIc40Su6r9WT2LR7", "model": "gpt-4-0613", "usage": {"total_tokens": 91, "prompt_tokens": 76, "completion_tokens": 15}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, I'm having trouble understanding your input. Could you please clarify?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768297, "system_fingerprint": null}	8d2de6bf-c2c1-4c6a-9d16-e4d5b8a595cc	1405	200	15	76	\N	gpt-4-0613	\N
b3269630-c374-4ee9-90a4-76dd98ce7087	2024-04-22 06:45:01.517+00	{"id": "chatcmpl-9Ghi7dSNM1xucNGECXkx0UaTIcbin", "model": "gpt-4-0613", "usage": {"total_tokens": 111, "prompt_tokens": 76, "completion_tokens": 35}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Dear Cliente,\\n\\nIt seems like your message was not clear. Could you please provide more information or clarify your needs? This will allow us to assist you better.\\n\\nBest Regards."}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768299, "system_fingerprint": null}	ef7d973f-6338-449a-ba25-7ea7a4f75960	2229	200	35	76	\N	gpt-4-0613	\N
96334404-59af-43a5-ac64-1aad203fd5bd	2024-04-22 06:45:04.338+00	{"id": "chatcmpl-9GhiAzxeUZbAuoHaHH2V7nifONFYD", "model": "gpt-4-0613", "usage": {"total_tokens": 98, "prompt_tokens": 76, "completion_tokens": 22}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, but your request appears to be unclear or incomplete. Could you provide more information or context, please?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768302, "system_fingerprint": null}	06823901-5602-45e1-a4e9-b255885174f9	2420	200	22	76	\N	gpt-4-0613	\N
011d1e62-1531-4c58-9050-460c44fe2b94	2024-04-22 06:45:07.368+00	{"id": "chatcmpl-9GhiE4Jj6yFlOpeW2DKB3IH6X9BJt", "model": "gpt-4-0613", "usage": {"total_tokens": 99, "prompt_tokens": 76, "completion_tokens": 23}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "It seems like the input provided is not clear. Could you please provide more context or clarify your question? Thanks."}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768306, "system_fingerprint": null}	ccaa7e0d-79c7-4b21-9f58-ff46428b0ecf	1747	200	23	76	\N	gpt-4-0613	\N
6a572c82-fdff-4383-93fc-6f72b764b7b9	2024-04-22 06:46:53.98+00	{"id": "chatcmpl-9GhjwLMo9B4WkOYJlvTnVfVTeLmXP", "model": "gpt-4-0613", "usage": {"total_tokens": 105, "prompt_tokens": 76, "completion_tokens": 29}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "It seems like there's some text that is quite difficult to understand in your prompt. Could you please provide a clear context or rephrase it?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768412, "system_fingerprint": null}	268f56c6-f837-44e7-b753-71d90278300a	1968	200	29	76	\N	gpt-4-0613	\N
5cb7e31b-97b3-4504-b2bf-1ef3ae576f10	2024-04-22 06:47:23.81+00	{"id": "chatcmpl-9GhkQ9ys3zWkPLrOtS14Zb9kA2a1D", "model": "gpt-4-0613", "usage": {"total_tokens": 97, "prompt_tokens": 76, "completion_tokens": 21}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, your message is not clear. Could you please provide more information so I can assist you better?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713768442, "system_fingerprint": null}	77215744-ee9e-4fd3-ac96-f70c90eb46ac	1633	200	21	76	\N	gpt-4-0613	\N
9d3ecf37-6279-4d01-aa78-f568b27f8feb	2024-04-22 07:20:40.638+00	{"id": "chatcmpl-9GiGdn312B4KhhaTDFVz5pBW9BOTa", "model": "gpt-4-0613", "usage": {"total_tokens": 98, "prompt_tokens": 76, "completion_tokens": 22}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, but I couldn't understand your statement. Can you please rephrase or provide more details?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770439, "system_fingerprint": null}	abe284fc-8567-46ab-9224-8f7a70e1238c	1508	200	22	76	\N	gpt-4-0613	\N
78060624-c23c-4037-9b92-5925129bb344	2024-04-22 07:21:02.277+00	{"id": "chatcmpl-9GiGyObgK8xI30bDp4PWXBsAeihNl", "model": "gpt-4-0613", "usage": {"total_tokens": 103, "prompt_tokens": 76, "completion_tokens": 27}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, I cannot provide a valid response as the input given is unclear. Could you please provide more details or ask a specific question?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770460, "system_fingerprint": null}	6cf5b418-141d-4f34-9e67-a099b01f750c	2378	200	27	76	\N	gpt-4-0613	\N
92ab761d-cf1e-4029-87e9-278a4b095919	2024-04-22 07:21:18.403+00	{"id": "chatcmpl-9GiHFNQinvhZGUCELZTM9nIGrGR1u", "model": "gpt-4-0613", "usage": {"total_tokens": 97, "prompt_tokens": 76, "completion_tokens": 21}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, I did not understand your request. Could you please provide more specifications or clarity in your statement?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770477, "system_fingerprint": null}	a0ca3eb7-29ba-4e22-8421-a2269bc06084	1529	200	21	76	\N	gpt-4-0613	\N
138d278b-0520-471d-9690-8bc53b0f9aed	2024-04-22 07:22:45.36+00	{"id": "chatcmpl-9GiIdPVKdQcLkWd7X2BIhXKPegp5S", "model": "gpt-4-0613", "usage": {"total_tokens": 95, "prompt_tokens": 76, "completion_tokens": 19}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, I could not understand your input. Could you please provide more clear information or context?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770563, "system_fingerprint": null}	8dfa352e-6ee4-47ea-a664-9cb46f303528	1785	200	19	76	\N	gpt-4-0613	\N
3f3dd2dd-16d1-4482-860b-6ccc4bb920aa	2024-04-22 07:25:54.52+00	{"id": "chatcmpl-9GiLgK6YIeOCqhd8Lz7L9RdBgYfAV", "model": "gpt-4-0613", "usage": {"total_tokens": 100, "prompt_tokens": 76, "completion_tokens": 24}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, but the text is not clear. Can you provide more information or rephrase it in a more understandable way?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770752, "system_fingerprint": null}	7f73b159-2f4c-4ecc-a8cf-30f500a26122	2225	200	24	76	\N	gpt-4-0613	\N
a1f1e42f-da1f-4a2f-b517-c17ab6fa6031	2024-04-22 07:26:01.33+00	{"id": "chatcmpl-9GiLnn4uXOoibpMGbYaonlx2JsweF", "model": "gpt-4-0613", "usage": {"total_tokens": 99, "prompt_tokens": 76, "completion_tokens": 23}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry but the information provided doesn't seem very clear. Can you provide more details or elaborate it differently?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770759, "system_fingerprint": null}	ee4745d9-ee8b-46e2-bc94-3626cf1cdbd5	1815	200	23	76	\N	gpt-4-0613	\N
a05eab17-e9b1-4fb9-aa05-e5a9980dde37	2024-04-22 07:26:22.506+00	{"id": "chatcmpl-9GiM8Gek4ULz8HAvLxV0qXAH1sOnY", "model": "gpt-4-0613", "usage": {"total_tokens": 99, "prompt_tokens": 76, "completion_tokens": 23}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, but I'm unable to understand your input. Could you please clarify what you need help with?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770780, "system_fingerprint": null}	e6ff9781-4c23-4c56-a0b6-d53e204df3fb	2392	200	23	76	\N	gpt-4-0613	\N
33774362-0680-4ee1-b8d8-6e77e517077f	2024-04-22 07:26:26.49+00	{"id": "chatcmpl-9GiMCenyyx3eoD6RrR7WDjneLViyl", "model": "gpt-4-0613", "usage": {"total_tokens": 109, "prompt_tokens": 76, "completion_tokens": 33}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry but your message seems to contain a lot of typos and it's hard for me to understand. Could you please rephrase or clarify your message?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770784, "system_fingerprint": null}	8b1a68f9-8b1a-419a-a945-90e04e45a11c	2413	200	33	76	\N	gpt-4-0613	\N
2c683a47-1d12-4715-98b4-0cf1afee0cb2	2024-04-22 07:28:56.663+00	{"id": "chatcmpl-9GiOdfhsPxFwE38Q3pmoEyFkCFQV3", "model": "gpt-4-0613", "usage": {"total_tokens": 104, "prompt_tokens": 76, "completion_tokens": 28}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, your input seems a bit confusing. Could you please provide more context or clarify your message so I can assist you better?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770935, "system_fingerprint": null}	654da587-94da-433f-a33f-fd761568ccc4	1928	200	28	76	\N	gpt-4-0613	\N
24d66400-02ff-45d3-b312-9691dcff33d4	2024-04-22 07:29:04.939+00	{"id": "chatcmpl-9GiOl9z1UxEblNhERCpWKahlgU6oW", "model": "gpt-4-0613", "usage": {"total_tokens": 98, "prompt_tokens": 76, "completion_tokens": 22}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, but I'm having trouble understanding your message. Could you please clarify or provide more information?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770943, "system_fingerprint": null}	f820e15e-b8b6-4861-8db2-5fe2f8e2b481	1717	200	22	76	\N	gpt-4-0613	\N
888a917f-a0f2-4486-b5f7-fe085c1bad30	2024-04-22 07:29:18.454+00	{"id": "chatcmpl-9GiOzLklPhV0ZWovKeJSWLBOVzTn2", "model": "gpt-4-0613", "usage": {"total_tokens": 97, "prompt_tokens": 76, "completion_tokens": 21}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, I didn't understand what you're saying. Could you please clarify or rephrase your message?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770957, "system_fingerprint": null}	9cd704cc-8549-40e4-8636-d0e20ddd54bf	1437	200	21	76	\N	gpt-4-0613	\N
96d568a8-4cb3-42a9-a8a5-8e5b2c428c08	2024-04-22 07:29:20.574+00	{"id": "chatcmpl-9GiP1iaMeRAlkuPUC7rv1vZyxrGbB", "model": "gpt-4-0613", "usage": {"total_tokens": 101, "prompt_tokens": 76, "completion_tokens": 25}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, I don't understand what you're asking. Could you please provide more context or rephrase your question?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770959, "system_fingerprint": null}	6a6e8a0a-ee28-41de-a28d-9ad213ad6c3e	1450	200	25	76	\N	gpt-4-0613	\N
433f38d7-a36a-49c7-89dc-f6fb0a7f2706	2024-04-22 07:29:22.797+00	{"id": "chatcmpl-9GiP3w1rdBszsd13lQLmAYN9X9AiB", "model": "gpt-4-0613", "usage": {"total_tokens": 115, "prompt_tokens": 76, "completion_tokens": 39}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "It appears you're typing with intermittent phrases and undefined abbreviations which makes it hard to understand your situation or question. Could you please provide a clear and brief description so I can assist you better?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770961, "system_fingerprint": null}	b9a47ec9-15fd-41f4-88c2-91173ae5b611	1789	200	39	76	\N	gpt-4-0613	\N
8d1c7bfd-6c25-4420-9003-2b2bbc33bc8a	2024-04-22 07:29:24.982+00	{"id": "chatcmpl-9GiP5kZYeFsyGOOa8bL8Rzh1wtN1Y", "model": "gpt-4-0613", "usage": {"total_tokens": 100, "prompt_tokens": 76, "completion_tokens": 24}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, but I'm having trouble understanding your input. Could you please rephrase it or provide more context?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770963, "system_fingerprint": null}	30f140e1-33f6-4c5c-b794-8c27f5864881	1632	200	24	76	\N	gpt-4-0613	\N
f6ff2106-725e-4597-a546-84bf2c65cd8d	2024-04-22 07:29:26.957+00	{"id": "chatcmpl-9GiP7ndZvv0QH2b3YUCEEVkPwbOrr", "model": "gpt-4-0613", "usage": {"total_tokens": 96, "prompt_tokens": 76, "completion_tokens": 20}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, but I didn't quite understand your input. Could you please provide more details or clarify?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713770965, "system_fingerprint": null}	3ebd8f46-99fd-4b77-a231-67d32c541685	1638	200	20	76	\N	gpt-4-0613	\N
ced7c7fc-12fb-4e51-a9c8-84fe37a3fd12	2024-04-22 07:32:17.038+00	{"id": "chatcmpl-9GiRrqFfMGknahyRpdiBadl6Sj1S5", "model": "gpt-4-0613", "usage": {"total_tokens": 101, "prompt_tokens": 76, "completion_tokens": 25}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, but I'm having trouble understanding your input. Can you please provide more clarity or rephrase your request?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713771135, "system_fingerprint": null}	641e9b8e-abb8-4f97-abaf-3e34129b54b1	2604	200	25	76	\N	gpt-4-0613	\N
21488dbf-d351-45b8-8c79-afb820727712	2024-04-22 07:32:22.884+00	{"id": "chatcmpl-9GiRvEJa3M4KeNAQZCFL8ooNyKe9s", "model": "gpt-4-0613", "usage": {"total_tokens": 135, "prompt_tokens": 76, "completion_tokens": 59}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "<helicone-prompt-output key=\\"test2\\">Your asdfdasd</helicone-prompt-output>sdafsadfadsfads <helicone-prompt-output key=\\"test\\">Your Inpsdsutsss</helicone-prompt-output>Applause sauce is delicious!!!!"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713771139, "system_fingerprint": null}	7f52a184-3c7e-4e75-866d-57c10f017649	4110	200	59	76	\N	gpt-4-0613	\N
cbb0a7f6-fe2d-49c1-a76d-0d643f547308	2024-04-22 20:41:28.133+00	{"id": "chatcmpl-9GulaNfV2COG4XezdMrDNwQGdh8du", "model": "gpt-4-0613", "usage": {"total_tokens": 105, "prompt_tokens": 76, "completion_tokens": 29}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, I am not able to understand what you're trying to convey. Can you please provide me with more information or rephrase your request?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713818486, "system_fingerprint": null}	85d9c056-350f-47f4-b226-daeac4ff5b8a	1753	200	29	76	\N	gpt-4-0613	\N
efddf84f-5f27-46fa-b797-c184c1413abb	2024-04-22 20:41:53.646+00	{"id": "chatcmpl-9Gum1KiOkfvzH9wOo0U3jlzNjBUE3", "model": "gpt-4-0613", "usage": {"total_tokens": 52, "prompt_tokens": 40, "completion_tokens": 12}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, but I'm not able to assist with that."}, "logprobs": null, "finish_reason": "stop"}], "created": 1713818513, "system_fingerprint": null}	eb6073a8-93c7-4f73-910a-c23a7dcc9888	823	200	12	40	\N	gpt-4-0613	\N
90984894-ba8f-46e1-899c-611cc64473fd	2024-04-22 20:42:00.776+00	{"id": "chatcmpl-9Gum5TLLKCK8vZqI0qlXd6lnedht4", "model": "gpt-4-0613", "usage": {"total_tokens": 75, "prompt_tokens": 40, "completion_tokens": 35}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, I am not able to understand your request because of the use of non-standard characters/words. Could you please ask your question again using standard English grammar and spelling?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713818517, "system_fingerprint": null}	b8b0331a-68b9-431e-ad50-4067b50dcb27	3017	200	35	40	\N	gpt-4-0613	\N
c309ad7a-5470-41bd-a923-8d16e3ce78cc	2024-04-22 20:42:32.57+00	{"id": "chatcmpl-9GumctYvvfrKkMIDZkSS7beIJWiHx", "model": "gpt-4-0613", "usage": {"total_tokens": 61, "prompt_tokens": 40, "completion_tokens": 21}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, your input seems to be incomprehensible. Could you please provide more specific and clear information?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713818550, "system_fingerprint": null}	f06a4b33-fd59-42bd-912d-3680c1a3e1fd	2334	200	21	40	\N	gpt-4-0613	\N
f8bfccc0-92d4-4197-b166-d5005e79d3ac	2024-04-22 20:46:48.095+00	{"id": "chatcmpl-9GuqlJG4E9hBZ4puHZZNJu9EpJ41y", "model": "gpt-4-0613", "usage": {"total_tokens": 49, "prompt_tokens": 40, "completion_tokens": 9}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, I can't assist with that."}, "logprobs": null, "finish_reason": "stop"}], "created": 1713818807, "system_fingerprint": null}	c9f6cf10-3325-47dd-9af7-55c5e6866f86	883	200	9	40	\N	gpt-4-0613	\N
e2317984-79c6-45c4-9934-e1845989aa65	2024-04-22 20:47:00.696+00	{"id": "chatcmpl-9GuqxfWIqpMbkx60fJWpCaxUq8bFf", "model": "gpt-4-0613", "usage": {"total_tokens": 50, "prompt_tokens": 40, "completion_tokens": 10}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "Sorry, but I can't assist with that."}, "logprobs": null, "finish_reason": "stop"}], "created": 1713818819, "system_fingerprint": null}	f8f502e5-ac47-46ab-a05e-1c5f43987941	1001	200	10	40	\N	gpt-4-0613	\N
8282b5bf-5c00-44ae-bdc2-272e180fc291	2024-04-22 20:47:29.836+00	{"id": "chatcmpl-9GurQLIBUcGK0pVGFOaD0A519ltfH", "model": "gpt-4-0613", "usage": {"total_tokens": 64, "prompt_tokens": 40, "completion_tokens": 24}, "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "I'm sorry, but your input is a bit unclear. Could you please provide more information or rephrase your statement?"}, "logprobs": null, "finish_reason": "stop"}], "created": 1713818848, "system_fingerprint": null}	fd378cc1-6616-42f9-92d8-72769144c9d3	2100	200	24	40	\N	gpt-4-0613	\N
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feedback (id, response_id, rating, created_at) FROM stdin;
\.


--
-- Data for Name: finetune_dataset; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.finetune_dataset (id, created_at, name, filters, organization_id, filter_node) FROM stdin;
\.


--
-- Data for Name: finetune_dataset_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.finetune_dataset_data (id, created_at, request_id, organization_id) FROM stdin;
\.


--
-- Data for Name: finetune_job; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.finetune_job (created_at, dataset_id, status, finetune_job_id, provider_key_id, id, organization_id) FROM stdin;
\.


--
-- Data for Name: helicone_proxy_key_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.helicone_proxy_key_limits (id, created_at, currency, cost, count, timewindow_seconds, helicone_proxy_key) FROM stdin;
\.


--
-- Data for Name: job; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job (id, org_id, created_at, updated_at, status, name, description, timeout_seconds, custom_properties) FROM stdin;
\.


--
-- Data for Name: job_node; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_node (id, org_id, created_at, updated_at, status, name, description, timeout_seconds, custom_properties, job, node_type, resource_data, resource_data_type) FROM stdin;
\.


--
-- Data for Name: job_node_relationships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_node_relationships (job_id, node_id, parent_node_id) FROM stdin;
\.


--
-- Data for Name: job_node_request; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_node_request (created_at, request_id, job_id, node_id) FROM stdin;
\.


--
-- Data for Name: layout; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.layout (id, created_at, filters, columns, user_id, name) FROM stdin;
\.


--
-- Data for Name: org_rate_limit_tracker; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.org_rate_limit_tracker (created_at, id, org_id, total_count) FROM stdin;
\.


--
-- Data for Name: organization_layout; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_layout (id, organization_id, type, filters, created_at) FROM stdin;
\.


--
-- Data for Name: organization_member; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_member (created_at, member, organization, org_role) FROM stdin;
2024-04-22 00:56:56.518623+00	f76629c5-a070-4bbc-9918-64beaea48848	83635a30-5ba6-41a8-8cc6-fb7df941b24a	owner
2024-04-22 00:56:56.518623+00	d9064bb5-1501-4ec9-bfee-21ab74d645b8	a75d76e3-02e7-4d02-8a2b-c65ed27c69b2	owner
\.


--
-- Data for Name: organization_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_usage (id, organization_id, start_date, end_date, quantity, type, error_message, stripe_record, recorded, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: prompt_input_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prompt_input_keys (id, key, prompt_version, created_at) FROM stdin;
7a1fb185-c565-46c4-bffc-d424bffa27bd	test2	58196b14-a20d-4755-a67f-a740138273d6	2024-04-22 03:44:08.074163+00
1b38b08d-5266-47b1-a125-1d1d09d85212	test	58196b14-a20d-4755-a67f-a740138273d6	2024-04-22 03:44:08.074163+00
a7c1931e-bfed-4572-b903-6fb5a7e84ace	test2	68e6987c-8ace-49e0-b71f-8422010f43b8	2024-04-22 03:50:50.296976+00
f339ee81-c5eb-45ca-87bd-632bbd82f115	test	68e6987c-8ace-49e0-b71f-8422010f43b8	2024-04-22 03:50:50.296976+00
e1be0929-4449-43ad-94cb-dc47a2bf1229	test2	5a2c4b98-8d9d-467b-88e5-9198987a9cef	2024-04-22 20:41:53.701296+00
c67c9996-e742-4851-8778-c3a0470083d5	test	5a2c4b98-8d9d-467b-88e5-9198987a9cef	2024-04-22 20:41:53.701296+00
\.


--
-- Data for Name: prompt_input_record; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prompt_input_record (id, inputs, source_request, prompt_version, created_at) FROM stdin;
49f6d205-fb3a-4e65-b1a3-5c410cc5c66f	{"test": "My Inpsdsutsss", "test2": "My asdfdasd"}	7566b7bb-1ad0-479c-945a-2a6297180e6e	58196b14-a20d-4755-a67f-a740138273d6	2024-04-22 03:44:08.078348+00
9dad822c-c21a-45d4-9d74-de574fb098d4	{"test": "My Inpsdsutsss", "test2": "My dsaasdfdasd"}	42f20772-321c-41f5-8bd0-ab10705bcc96	68e6987c-8ace-49e0-b71f-8422010f43b8	2024-04-22 03:50:50.301558+00
75219c1d-dbbc-4e6c-a64c-3b64eb46abe4	{"test": "My Inpsdsutsss", "test2": "My asdfdasd"}	eb6073a8-93c7-4f73-910a-c23a7dcc9888	5a2c4b98-8d9d-467b-88e5-9198987a9cef	2024-04-22 20:41:53.705223+00
e33e6d1b-0e92-4469-8e8f-f46785dba999	{"test": "My Inpsdsutsss", "test2": "My asdfdasd"}	b8b0331a-68b9-431e-ad50-4067b50dcb27	5a2c4b98-8d9d-467b-88e5-9198987a9cef	2024-04-22 20:42:00.824848+00
abf703d3-4896-4e3c-af44-e7399011dd39	{"test": "My Inpsdsutsss", "test2": "My asdfdasd"}	f06a4b33-fd59-42bd-912d-3680c1a3e1fd	5a2c4b98-8d9d-467b-88e5-9198987a9cef	2024-04-22 20:42:32.617925+00
dca3539f-84db-4156-8a3e-b6c2f302d9df	{"test": "My Inpsdsutsss", "test2": "My asdfdasd"}	c9f6cf10-3325-47dd-9af7-55c5e6866f86	5a2c4b98-8d9d-467b-88e5-9198987a9cef	2024-04-22 20:46:48.167557+00
ef1c8400-3d44-482a-92f1-de3e47714d3d	{"test": "My Inpsdsutsss", "test2": "My asdfdasd"}	f8f502e5-ac47-46ab-a05e-1c5f43987941	5a2c4b98-8d9d-467b-88e5-9198987a9cef	2024-04-22 20:47:00.769889+00
dce547c3-2bdb-4462-b479-887768ae2ad8	{"test": "My Inpsdsutsss", "test2": "My asdfdasd"}	fd378cc1-6616-42f9-92d8-72769144c9d3	5a2c4b98-8d9d-467b-88e5-9198987a9cef	2024-04-22 20:47:29.900214+00
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.properties (id, created_at, user_id, request_id, auth_hash, key, value) FROM stdin;
1	2024-04-22 03:44:06.714+00	\N	7566b7bb-1ad0-479c-945a-2a6297180e6e	\N	Helicone-Prompt-Input-test2	My asdfdasd
2	2024-04-22 03:44:06.714+00	\N	7566b7bb-1ad0-479c-945a-2a6297180e6e	\N	Helicone-Prompt-Input-test	My Inpsdsutsss
3	2024-04-22 03:50:49.425+00	\N	42f20772-321c-41f5-8bd0-ab10705bcc96	\N	Helicone-Prompt-Input-test2	My dsaasdfdasd
4	2024-04-22 03:50:49.425+00	\N	42f20772-321c-41f5-8bd0-ab10705bcc96	\N	Helicone-Prompt-Input-test	My Inpsdsutsss
5	2024-04-22 20:41:52.827+00	\N	eb6073a8-93c7-4f73-910a-c23a7dcc9888	\N	Helicone-Prompt-Input-test2	My asdfdasd
6	2024-04-22 20:41:52.827+00	\N	eb6073a8-93c7-4f73-910a-c23a7dcc9888	\N	Helicone-Prompt-Input-test	My Inpsdsutsss
7	2024-04-22 20:41:57.759+00	\N	b8b0331a-68b9-431e-ad50-4067b50dcb27	\N	Helicone-Prompt-Input-test2	My asdfdasd
8	2024-04-22 20:41:57.759+00	\N	b8b0331a-68b9-431e-ad50-4067b50dcb27	\N	Helicone-Prompt-Input-test	My Inpsdsutsss
9	2024-04-22 20:42:30.236+00	\N	f06a4b33-fd59-42bd-912d-3680c1a3e1fd	\N	Helicone-Prompt-Input-test2	My asdfdasd
10	2024-04-22 20:42:30.236+00	\N	f06a4b33-fd59-42bd-912d-3680c1a3e1fd	\N	Helicone-Prompt-Input-test	My Inpsdsutsss
11	2024-04-22 20:46:47.213+00	\N	c9f6cf10-3325-47dd-9af7-55c5e6866f86	\N	Helicone-Prompt-Input-test2	My asdfdasd
12	2024-04-22 20:46:47.213+00	\N	c9f6cf10-3325-47dd-9af7-55c5e6866f86	\N	Helicone-Prompt-Input-test	My Inpsdsutsss
13	2024-04-22 20:46:47.213+00	\N	c9f6cf10-3325-47dd-9af7-55c5e6866f86	\N	Helicone-Prompt-Id	Testy3
14	2024-04-22 20:46:59.696+00	\N	f8f502e5-ac47-46ab-a05e-1c5f43987941	\N	Helicone-Prompt-Input-test2	My asdfdasd
15	2024-04-22 20:46:59.696+00	\N	f8f502e5-ac47-46ab-a05e-1c5f43987941	\N	Helicone-Prompt-Input-test	My Inpsdsutsss
16	2024-04-22 20:46:59.696+00	\N	f8f502e5-ac47-46ab-a05e-1c5f43987941	\N	Helicone-Prompt-Id	Testy3
17	2024-04-22 20:47:27.737+00	\N	fd378cc1-6616-42f9-92d8-72769144c9d3	\N	Helicone-Prompt-Input-test2	My asdfdasd
18	2024-04-22 20:47:27.737+00	\N	fd378cc1-6616-42f9-92d8-72769144c9d3	\N	Helicone-Prompt-Input-test	My Inpsdsutsss
19	2024-04-22 20:47:27.737+00	\N	fd378cc1-6616-42f9-92d8-72769144c9d3	\N	Helicone-Prompt-Id	Testy3
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referrals (id, referrer_user_id, referred_user_id, created_at, status) FROM stdin;
\.


--
-- Data for Name: request_job_task; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.request_job_task (request_id, job_id, task_id) FROM stdin;
\.


--
-- Data for Name: rosetta_mappers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rosetta_mappers (id, key, version, status, output_schema_hash, output_schema, input_json, code, ignored_fields, mapped_fields, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: score_attribute; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.score_attribute (id, score_key, organization, created_at) FROM stdin;
\.


--
-- Data for Name: score_value; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.score_value (id, int_value, score_attribute, request_id, created_at) FROM stdin;
\.


--
-- Data for Name: user_api_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_api_keys (created_at, api_key_hash, api_key_preview, user_id, key_name) FROM stdin;
\.


--
-- Data for Name: user_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_feedback (id, created_at, feedback, organization_id, tag) FROM stdin;
\.


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_settings ("user", created_at, request_limit, tier, referral_code) FROM stdin;
f76629c5-a070-4bbc-9918-64beaea48848	2024-04-22 00:56:56.518623+00	1000	free	7315106c-e736-4616-8355-7649d80e846c
d9064bb5-1501-4ec9-bfee-21ab74d645b8	2024-04-22 00:56:56.518623+00	1000	free	943167fa-495d-46cb-a0eb-6a317ad2a2a4
\.


--
-- Data for Name: webhooks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhooks (id, created_at, is_verified, org_id, txt_record, destination) FROM stdin;
\.


--
-- Data for Name: webhook_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhook_subscriptions (id, created_at, webhook_id, event, payload_type) FROM stdin;
\.


--
-- Name: contact_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contact_submissions_id_seq', 1, false);


--
-- Name: experiment_dataset_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.experiment_dataset_values_id_seq', 1, false);


--
-- Name: feature_flags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.feature_flags_id_seq', 1, false);


--
-- Name: helicone_api_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.helicone_api_keys_id_seq', 2, true);


--
-- Name: layout_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.layout_id_seq', 1, false);


--
-- Name: properties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.properties_id_seq', 19, true);


--
-- Name: user_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_feedback_id_seq', 1, false);


--
-- Name: webhook_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.webhook_subscriptions_id_seq', 1, false);


--
-- Name: webhooks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.webhooks_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

