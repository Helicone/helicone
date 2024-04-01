import { render, Text } from "ink";
import SelectInput from "ink-select-input";
import React from "react";
import { listProjects } from "./projects";

export async function promptSelectProject({
	accountId,
}: {
	accountId: string;
}): Promise<string> {
	const projects = await listProjects({ accountId });

	return new Promise((resolve) => {
		const { unmount } = render(
			<>
				<Text>Select a project:</Text>
				<SelectInput
					items={projects.map((project) => ({
						key: project.name,
						label: project.name,
						value: project,
					}))}
					onSelect={async (selected) => {
						resolve(selected.value.name);
						unmount();
					}}
				/>
			</>
		);
	});
}
