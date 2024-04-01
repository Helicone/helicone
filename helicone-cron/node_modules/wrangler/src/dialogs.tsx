import chalk from "chalk";
import { Box, Text, useInput, render } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import * as React from "react";
import { useState } from "react";

import { CI } from "./is-ci";
import isInteractive from "./is-interactive";
import { logger } from "./logger";

type ConfirmProps = {
	text: string;
	onConfirm: (answer: boolean) => void;
};
function Confirm(props: ConfirmProps) {
	useInput((input: string, key) => {
		if (input === "y" || key.return === true) {
			props.onConfirm(true);
		} else if (input === "n") {
			props.onConfirm(false);
		} else {
			logger.warn("Unrecognised input:", input);
		}
	});
	return (
		<Box>
			<Text>
				{props.text} ({chalk.bold("y")}/n)
			</Text>
		</Box>
	);
}

export function confirm(
	text: string,
	beforeConfirm?: JSX.Element
): Promise<boolean> {
	return new Promise((resolve) => {
		const { unmount } = render(
			<Box flexDirection="column">
				{beforeConfirm}
				<Confirm
					text={text}
					onConfirm={(answer: boolean) => {
						unmount();
						resolve(answer);
					}}
				/>
			</Box>
		);
	});
}

type PromptProps = {
	text: string;
	defaultValue?: string;
	type?: "text" | "password";
	onSubmit: (text: string) => void;
};

function Prompt(props: PromptProps) {
	const [value, setValue] = useState(props.defaultValue || "");

	return (
		<Box>
			<Text>{props.text} </Text>
			<Box>
				<TextInput
					mask={props.type === "password" ? "*" : undefined}
					value={value}
					onChange={setValue}
					onSubmit={props.onSubmit}
				/>
			</Box>
		</Box>
	);
}

export async function prompt(
	text: string,
	type: "text" | "password" = "text",
	defaultValue?: string
): Promise<string> {
	return new Promise((resolve) => {
		const { unmount } = render(
			<Prompt
				text={text}
				defaultValue={defaultValue}
				type={type}
				onSubmit={(inputText) => {
					unmount();
					resolve(inputText);
				}}
			/>
		);
	});
}

type SelectOption = {
	value: string;
	label: string;
};

type SelectProps = {
	text: string;
	options: SelectOption[];
	initialIndex: number;
	onSelect: (value: string) => void;
};

function Select(props: SelectProps) {
	return (
		<Box flexDirection="column">
			<Text>{props.text}</Text>
			<SelectInput
				initialIndex={props.initialIndex}
				items={props.options}
				onSelect={async (selected) => {
					props.onSelect(selected.value);
				}}
			/>
		</Box>
	);
}

export function select(
	text: string,
	options: SelectOption[],
	initialIndex: number
): Promise<string> {
	return new Promise((resolve) => {
		const { unmount } = render(
			<Select
				text={text}
				options={options}
				initialIndex={initialIndex}
				onSelect={(option: string) => {
					unmount();
					resolve(option);
				}}
			/>
		);
	});
}

export function logDim(msg: string) {
	console.log(chalk.gray(msg));
}

export async function fromDashMessagePrompt(
	deploySource: "dash" | "wrangler" | "api"
): Promise<boolean | void> {
	if (deploySource === "dash") {
		logger.warn(
			`You are about to publish a Workers Service that was last published via the Cloudflare Dashboard.\nEdits that have been made via the dashboard will be overridden by your local code and config.`
		);

		if (!isInteractive() || CI.isCI()) return true;

		return await confirm("Would you like to continue?");
	}
}
export async function tailDOLogPrompt(): Promise<boolean | void> {
	if (!isInteractive() || CI.isCI()) return true;

	return await confirm("Would you like to continue?");
}
