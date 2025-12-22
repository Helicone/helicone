<?php
/**
 * SAML 2.0 Service Provider (SP) Remote Metadata
 *
 * This configures the IdP to trust the remote Supabase instance as a Service Provider.
 */

// Configuration for remote Supabase
$metadata['https://zpxpwznewawbyvdumfbj.supabase.co/auth/v1/sso/saml/metadata'] = [
    'name' => [
        'en' => 'Helicone (Supabase)',
    ],
    'description' => [
        'en' => 'Helicone production Supabase instance',
    ],

    // The ACS URL - where SAML assertions are POSTed
    'AssertionConsumerService' => [
        [
            'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            'Location' => 'https://zpxpwznewawbyvdumfbj.supabase.co/auth/v1/sso/saml/acs',
            'index' => 0,
        ],
    ],

    // Single Logout Service
    'SingleLogoutService' => [
        [
            'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            'Location' => 'https://zpxpwznewawbyvdumfbj.supabase.co/auth/v1/sso/saml/slo',
        ],
    ],

    // NameID format - Supabase expects email format
    'NameIDFormat' => 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',

    // Send the 'email' attribute as the NameID
    'simplesaml.nameidattribute' => 'email',

    // Attributes to include in the assertion
    'attributes' => [
        'email',
        'displayName',
        'groups',
    ],
];
