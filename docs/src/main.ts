import "./style.css";
import "highlight.js/styles/nord.css";
import hljs from "highlight.js/lib/common";

// create a copy button as a plugin for highlight js
hljs.addPlugin({
	"after:highlightElement": ({ el }) => {
		const copyButton = document.createElement("button");
		copyButton.className = "copy-button";
		copyButton.setAttribute("aria-label", "Copy code");
		copyButton.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6Z" fill="currentColor"></path></svg>`;
		copyButton.addEventListener("click", () => {
			const text = el.textContent;

			if (!text) {
				return;
			}

			navigator.clipboard.writeText(text);
			copyButton.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z" fill="currentColor"></path></svg>`;
			setTimeout(() => {
				copyButton.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6Z" fill="currentColor"></path></svg>`;
			}, 5000);
		});

		el.parentElement?.append(copyButton);
	},
});

hljs.highlightAll();

async function getLatestRelease() {
	const res = await fetch(
		"https://api.github.com/repos/royalfig/share-button/releases/latest",
	);
	const data = await res.json();

	const { html_url, tag_name, published_at } = data;

	const date = new Date(published_at).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	const updatedOn = document.getElementById("updated-on");
	const version = document.getElementById("version") as HTMLAnchorElement;

	if (!updatedOn || !version) {
		return;
	}

	updatedOn.textContent = date;

	version.href = html_url;
	const svg = version.querySelector("svg");
	version.textContent = tag_name;
	svg && version.prepend(svg);
}

getLatestRelease();
