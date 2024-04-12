import { FastaSequenceFile } from "biotech-js";
import { shell } from "electron";
import { writeFileSync, readdirSync, mkdirSync } from "fs";
import path from "path";

export const run = async (folders: string[], outputFolder: string) => {
	// Aggregate all k0 files
	const k0Files: {
		[key: string]: string[];
	} = {};
	folders.forEach((folder) => {
		const files = readdirSync(folder);
		files.forEach((filename) => {
			const pureK0 = filename.split("_")[0];
			const k0Path = path.join(folder, filename);
			if (k0Files[pureK0]) {
				k0Files[pureK0].push(k0Path);
			} else {
				k0Files[pureK0] = [k0Path];
			}
		});
	});
	// Ensure the output dir is there
	mkdirSync(outputFolder, {
		recursive: true,
	});
	// loop for each k0
	const keys = Object.keys(k0Files);
	for (let i = 0; i < keys.length; i++) {
		let k0Number = 0;
		const k0Name = keys[i];
		const k0FilesArray = k0Files[k0Name];
		let sequences: { name: string; sequence: string }[] = [];
		for (let j = 0; j < k0FilesArray.length; j++) {
			const k0Path = k0FilesArray[j];
			if (!k0Path.endsWith(".fasta") && !k0Path.endsWith(".fa")) {
				continue;
			}

			const file = new FastaSequenceFile(k0Path);
			await file.process();
			k0Number += file.sequencesNumber;
			sequences = sequences.concat(
				file.sequences.map((seq) => ({
					name: seq.description,
					sequence: seq.sequence,
				}))
			);
		}
		const outputFilePath = path.join(
			outputFolder,
			`${k0Name}_${k0Number}.fasta`
		);
		saveFastaFile(sequences, outputFilePath);
	}
	shell.openPath(outputFolder);
};

export const saveFastaFile = (
	sequences: { name: string; sequence: string }[],
	filePath: string
) => {
	const content = sequences
		.map(({ name, sequence }) => {
			let sequenceText = `>${name.replace(/\n/g, "").replace(/\r/g, "")}\n`;
			for (let i = 0; i < sequence.length; i += 60) {
				sequenceText += sequence.slice(i, i + 60) + "\n";
			}
			return sequenceText;
		})
		.join("");

	writeFileSync(filePath, content);
};
