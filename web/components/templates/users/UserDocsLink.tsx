import React from 'react';
import Link from 'next/link';
import { DocumentIcon } from '@heroicons/react/outline'; // Replace this with the actual icon import you wish to use

const UserDocsLink = () => {
    return (
        <div className="flex justify-center my-6">
            <Link href="https://docs.helicone.ai/features/advanced-usage/user-metrics" passHref>
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-tremor-brand-default text-tremor-brand-default hover:bg-tremor-brand-default hover:text-tremor-brand-inverted rounded-tremor-default transition duration-300 ease-in-out dark:border-dark-tremor-brand-default dark:text-dark-tremor-brand-default dark:hover:bg-dark-tremor-brand-default dark:hover:text-tremor-brand-inverted"
                    aria-label="Learn how to add more users"
                >
                    <DocumentIcon className="w-5 h-5 mr-2 dark:text-dark-tremor-content-inverted" />
                    Learn how to add more users
                </a>
            </Link>
        </div>
    );
};

export default UserDocsLink;
