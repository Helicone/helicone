<?php
/**
 * Authentication Sources Configuration
 *
 * Test users for local SAML IdP.
 * Format: 'username:password' => ['attribute' => 'value']
 */
$config = [
    'example-userpass' => [
        'exampleauth:UserPass',

        // Test user for example.com domain
        'testuser:testpass' => [
            'uid' => ['testuser'],
            'email' => ['testuser@example.com'],
            'displayName' => ['Test User'],
            'groups' => ['users', 'admins'],
        ],

        // Additional test users
        'alice:alice123' => [
            'uid' => ['alice'],
            'email' => ['alice@example.com'],
            'displayName' => ['Alice Smith'],
            'groups' => ['users'],
        ],

        'bob:bob123' => [
            'uid' => ['bob'],
            'email' => ['bob@example.com'],
            'displayName' => ['Bob Jones'],
            'groups' => ['users', 'developers'],
        ],

        // Admin user
        'admin:admin123' => [
            'uid' => ['admin'],
            'email' => ['admin@example.com'],
            'displayName' => ['Admin User'],
            'groups' => ['users', 'admins', 'super-admins'],
        ],
    ],
];
