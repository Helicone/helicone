INSERT INTO auth.users (instance_id,id,aud,"role",email,encrypted_password,email_confirmed_at,last_sign_in_at,raw_app_meta_data,raw_user_meta_data,is_super_admin,created_at,updated_at,phone,phone_confirmed_at,confirmation_token,email_change,email_change_token_new,recovery_token) VALUES
	('00000000-0000-0000-0000-000000000000'::uuid,'f76629c5-a070-4bbc-9918-64beaea48848'::uuid,'authenticated','authenticated','test@helicone.ai','$2a$10$PznXR5VSgzjnAp7T/X7PCu6vtlgzdFt1zIr41IqP0CmVHQtShiXxS','2022-02-11 21:02:04.547','2022-02-11 22:53:12.520','{"provider": "email", "providers": ["email"]}','{}',FALSE,'2022-02-11 21:02:04.542','2022-02-11 21:02:04.542',NULL,NULL,'','','',''),
	('00000000-0000-0000-0000-000000000000'::uuid,'d9064bb5-1501-4ec9-bfee-21ab74d645b8'::uuid,'authenticated','authenticated','demo@helicone.ai','$2a$10$mOJUAphJbZR4CdM38.bgOeyySurPeFHoH/T1s7HuGdpRb7JgatF7K','2022-02-12 07:40:23.616','2022-02-12 07:40:23.621','{"provider": "email", "providers": ["email"]}','{}',FALSE,'2022-02-12 07:40:23.612','2022-02-12 07:40:23.613',NULL,NULL,'','','','')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at) VALUES
	('f76629c5-a070-4bbc-9918-64beaea48848','f76629c5-a070-4bbc-9918-64beaea48848'::uuid,'{"sub": "f76629c5-a070-4bbc-9918-64beaea48848"}','email','2022-02-11 21:02:04.545','2022-02-11 21:02:04.545','2022-02-11 21:02:04.545'),
	('d9064bb5-1501-4ec9-bfee-21ab74d645b8','d9064bb5-1501-4ec9-bfee-21ab74d645b8'::uuid,'{"sub": "d9064bb5-1501-4ec9-bfee-21ab74d645b8"}','email','2022-02-12 07:40:23.615','2022-02-12 07:40:23.615','2022-02-12 07:40:23.615')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.organization (id, name, owner, has_onboarded, organization_type)
VALUES
    ('83635a30-5ba6-41a8-8cc6-fb7df941b24a', 'Organization for Test', 'f76629c5-a070-4bbc-9918-64beaea48848', true, 'reseller'),
    ('a75d76e3-02e7-4d02-8a2b-c65ed27c69b2', 'Organization for Demo', 'd9064bb5-1501-4ec9-bfee-21ab74d645b8', true, 'reseller');

-- sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa -- Organization for Test
INSERT INTO public.helicone_api_keys (api_key_hash, api_key_name, user_id, organization_id, soft_delete) 
VALUES 
('014c02f17208d4f521b0bad39a1d0174e015e86f925cbbcc25108ffea74fd7f2', 'Test', 'f76629c5-a070-4bbc-9918-64beaea48848', '83635a30-5ba6-41a8-8cc6-fb7df941b24a', FALSE);

-- sk-helicone-zk6xu4a-kluegtq-sbljk7q-drnixzi
INSERT INTO public.helicone_api_keys (api_key_hash, api_key_name, user_id, organization_id, soft_delete) 
VALUES 
('4a6ced8c61492670cfd56f31e6e4c40e7cf8c6b88b7ab0a70efc5f86c136b9c3', 'Demo', 'd9064bb5-1501-4ec9-bfee-21ab74d645b8', 'a75d76e3-02e7-4d02-8a2b-c65ed27c69b2', FALSE);