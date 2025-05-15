import {
  xIcon,
  fbIcon,
  liIcon,
  copyIcon,
  copiedIcon,
  whatsappIcon,
  telegramIcon,
  emailIcon,
} from "./icons";

type PopoverContent = {
  title: string;
  linkUrl: string;
  shareText?: string;
  networks: string;
  isAtomic: boolean;
  copiedLabel: string;
  // Add an optional property for the copy link label
  copyLinkLabel?: string;
};

export function createPopoverContent({
  title,
  linkUrl,
  networks,
  isAtomic,
  copiedLabel,
  // Destructure the new copyLinkLabel
  copyLinkLabel,
}: PopoverContent) {
  function createSocialMediaLink(
    icon: string,
    network: string,
    shareURL: string
  ) {
    let finalUrl = shareURL.replace(/{{url}}/g, linkUrl);

    if (title) {
      finalUrl = finalUrl.replace(/{{text}}/g, title);
    }

    const a = document.createElement("a");
    a.classList.add("social-media", network.toLowerCase());
    a.href = encodeURI(finalUrl);
    a.setAttribute("aria-label", `Share on ${network}`);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
    a.setAttribute("part", `share-link ${network.toLowerCase()}`);
    a.innerHTML = `${icon} ${isAtomic ? "" : ` ${network}`}`;

    return a;
  }

  const networksMap = new Map([
    [
      "facebook",
      {
        html: createSocialMediaLink(
          fbIcon,
          "Facebook",
          "http://www.facebook.com/sharer.php?u={{url}}"
        ),
      },
    ],
    [
      "x",
      {
        html: createSocialMediaLink(
          xIcon,
          "X",
          "https://twitter.com/intent/tweet?url={{url}}&text={{text}}"
        ),
      },
    ],
    [
      "linkedin",
      {
        html: createSocialMediaLink(
          liIcon,
          "LinkedIn",
          "https://www.linkedin.com/feed/?shareActive=true&text={{text}} {{url}}"
        ),
      },
    ],
    [
      "email",
      {
        html: createSocialMediaLink(
          emailIcon,
          "Email",
          "mailto:?subject=Check out {{text}}&body={{text}} {{url}}"
        ),
      },
    ],
    [
      "whatsapp",
      {
        html: createSocialMediaLink(
          whatsappIcon,
          "WhatsApp",
          "https://api.whatsapp.com/send?text={{text}} {{url}}"
        ),
      },
    ],
    [
      "telegram",
      {
        html: createSocialMediaLink(
          telegramIcon,
          "Telegram",
          "https://t.me/share/url?url={{url}}&text={{text}}"
        ),
      },
    ],
    ["copy", { html: createSocialMediaLink(copyIcon, "copy", "") }],
  ]);

  const div = document.createElement("div");
  div.classList.add("popover-inner");
  div.setAttribute("part", "popover-inner");

  const parsedNetworks = networks.split(",").map((network) => {
    const trimmedNetwork = network.trim().toLowerCase();
    if (trimmedNetwork === "copy") {
      const btn = document.createElement("button");
      btn.classList.add("social-media", "copy-button");
      btn.setAttribute("aria-label", "Copy link");
      btn.setAttribute("part", `share-link ${trimmedNetwork}`);
      // Use copyLinkLabel if provided, otherwise default to "Copy link"
      const initial = `${copyIcon} <span>${copyLinkLabel || "Copy link"}</span>`;
      const initialAtomic = copyIcon;
      btn.innerHTML = isAtomic ? initialAtomic : initial;

      btn.addEventListener("click", async (e) => {
        const currentTarget = e.currentTarget as Element;

        if (!currentTarget) {
          console.error("Error copying. Element not found");
          return;
        }

        try {
          await navigator.clipboard.writeText(linkUrl);
          btn.disabled = true;

          if (isAtomic) {
            btn.innerHTML = copiedIcon;
          } else {
            btn.innerHTML = `${copiedIcon} <span>${copiedLabel}</span>`;
          }

          setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = isAtomic ? initialAtomic : initial;
          }, 5000);
        } catch (err) {
          console.error("[Share Button] We could not copy this", err);
        }
      });
      return btn;
    }
    const networkElement = networksMap.get(trimmedNetwork);
    return networkElement ? networkElement.html : "";
  });

  const socialMediaContainer = document.createElement("div");
  isAtomic && socialMediaContainer.classList.add("atomic");
  socialMediaContainer.classList.add("social-media-container");
  socialMediaContainer.setAttribute("part", "share-social-media");
  socialMediaContainer.append(...parsedNetworks);
  div.append(socialMediaContainer);
  const triangleUp = document.createElement("div");
  triangleUp.classList.add("triangle-up");
  div.prepend(triangleUp);
  const triangleDown = document.createElement("div");
  triangleDown.classList.add("triangle-down");
  div.append(triangleDown);

  if (!isAtomic) {
    return div;
  }

  return socialMediaContainer;
}