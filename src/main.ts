import { createDarkModeStyles } from "./dark-mode";
import { createPopoverContent } from "./popover";
import { icons } from "./icons";
import style from "./style.css?inline";
import { createUserStyles } from "./user-styles";

type PopoverCoords = {
  top: number;
  left: number;
  width: number;
  height: number;
} | null;

export class ShareButton extends HTMLElement {
  isPopoverSupport = Object.prototype.hasOwnProperty.call(
    HTMLElement.prototype,
    "popover"
  );
  isMobile =
    (/android/i.test(navigator.userAgent) ||
      /iPhone|iPad|iPod/i.test(navigator.userAgent)) &&
    navigator.share;
  shadow = this.attachShadow({ mode: "open" });
  state = false;
  static observedAttributes = ["dark-mode"];

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  private showCopiedFeedback(copiedLabel: string, button: HTMLElement) {
    const feedback = document.createElement("span");
    feedback.textContent = copiedLabel;
    feedback.className = "copied-feedback";
    button.appendChild(feedback);
    setTimeout(() => {
      feedback.remove();
    }, 1000);
  }

  render() {
    const title =
      this.getAttribute("data-title") ||
      document.querySelector("title")?.textContent ||
      document.querySelector("h1")?.textContent ||
      "";

    const linkUrl = this.getAttribute("data-url") || window.location.href;
    const copiedLabel = this.getAttribute("data-copied-label") || "Copied!";
    const copyLinkLabel = this.getAttribute("data-copy-link-label");

    const userStyles = createUserStyles(this);
    const icon = this.createIcon();
    const isAtomic = this.hasAttribute("atomic");
    const popover = this.createPopover(title, linkUrl, isAtomic, copiedLabel, copyLinkLabel);
    const button: HTMLElement | null = isAtomic ? null : this.createButton(icon);

    // dark mode styles
    const darkModeStyles = createDarkModeStyles(this);

    const styles = new CSSStyleSheet();
    styles.replaceSync(style + userStyles + darkModeStyles);
    this.shadow.adoptedStyleSheets = [styles];

    const wrapper = document.createElement("div");
    wrapper.setAttribute("class", "wrapper");
    wrapper.setAttribute("part", "share-wrapper");
    wrapper.append(
      ...(button ? [button] : []), 
      this.isPopoverSupport ? popover : document.createElement("div")
    );

    this.shadow.replaceChildren(wrapper);

    let popoverCoords: PopoverCoords = null;

    if (!isAtomic && button) {
      button.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLElement;

        // Mobile share
        if (this.isMobile) {
          try {
            navigator.share({ title, url: linkUrl });
            target.removeAttribute("popover");
          } catch (err) {
            console.error(err);
          }
          return;
        }

        // Popover support
        if (this.isPopoverSupport) {
          const popoverClone = popover.cloneNode(true) as HTMLElement;
          popoverClone.removeAttribute("id");
          popoverClone.removeAttribute("popover");
          wrapper.append(popoverClone);
          popoverClone.style.visibility = "hidden";
          popoverClone.style.pointerEvents = "none";
          popoverClone.classList.add("up", "popover-clone");
          popoverCoords = popoverClone.getBoundingClientRect();
          popoverClone.remove();

          const buttonCoords = target.getBoundingClientRect();
          let left = `${buttonCoords.left + buttonCoords.width / 2 - popoverCoords.width / 2}px`;

          if (buttonCoords.left < 100) {
            left = `${buttonCoords.left + buttonCoords.width / 2 - popoverCoords.width * 0.25}px`;
            popover.classList.add("left-adjust");
          }

          if (buttonCoords.right > window.innerWidth - 100) {
            left = `${buttonCoords.left + buttonCoords.width / 2 - popoverCoords.width * 0.75}px`;
            popover.classList.add("right-adjust");
          }

          const scrollY = window.scrollY;
          popover.style.left = left;
          popover.style.top =
            document.documentElement.clientHeight / 2 > buttonCoords.y
              ? `${scrollY + buttonCoords.top + buttonCoords.height}px`
              : `${scrollY + buttonCoords.top - popoverCoords.height}px`;
          popover.classList.toggle("up", document.documentElement.clientHeight / 2 > buttonCoords.y);
          popover.classList.toggle("down", !(document.documentElement.clientHeight / 2 > buttonCoords.y));

          return;
        }

        // Clipboard copy
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(linkUrl)
            .then(() => {
              if (button) this.showCopiedFeedback(copiedLabel, button);
            })
            .catch(err => console.error("[Share Button] Clipboard write failed", err));
        } else {
          const input = document.createElement("input");
          input.value = linkUrl;
          document.body.appendChild(input);
          input.select();
          try {
            document.execCommand("copy");
            if (button) this.showCopiedFeedback(copiedLabel, button);
          } catch (err) {
            console.error("[Share Button] Copy fallback failed", err);
          }
          document.body.removeChild(input);
        }
      });
    }

    if (!isAtomic) {
      const closePopover = () => {
        const popoverEl = this.shadow.querySelector("[popover]") as HTMLElement | null;
        popoverEl?.hidePopover?.();
      };
      window.addEventListener("resize", closePopover);
      window.addEventListener("scroll", closePopover);
    }
  }


  createIcon() {
    const iconChoice = this.getAttribute("icon") || "1";

    let icon: string;

    if (iconChoice === "false") {
      icon = "";
    } else if (!["1", "2", "3", "4", "5", "6", "7"].includes(iconChoice)) {
      icon = icons["1" as keyof typeof icons];
    } else {
      icon = icons[iconChoice as keyof typeof icons];
    }
    return icon;
  }

  createButton(icon: string) {
    const button = document.createElement("button");
    button.setAttribute("part", "share-button");
    button.setAttribute("class", "share-button");
    const isNoText = this.hasAttribute("notext");

    if (this.isPopoverSupport && !this.isMobile) {
      button.setAttribute("popovertarget", "share-popover");
    }

    const isCircle = this.hasAttribute("circle");

    if (isCircle || isNoText) {
      button.setAttribute("aria-label", "Share");
      button.innerHTML = icon;
    } else {
      button.innerHTML = `${icon} <slot></slot>`;
    }
    return button;
  }

  createPopover(
    title: string,
    linkUrl: string,
    isAtomic = false,
    copiedLabel: string,
    // Add copyLinkLabel parameter
    copyLinkLabel?: string | null
  ) {
    const networks =
      this.getAttribute("networks") ||
      "x, linkedin, facebook, email, whatsapp, telegram, copy";
    const popoverContent = createPopoverContent({
      title,
      linkUrl,
      shareText: this.textContent ?? "Share",
      networks,
      isAtomic,
      copiedLabel,
      // Pass copyLinkLabel to createPopoverContent
      copyLinkLabel: copyLinkLabel ?? undefined,
    });

    if (!isAtomic) {
      const popover = document.createElement("div");
      popover.setAttribute("id", "share-popover");
      popover.setAttribute("part", "share-popover");
      popover.setAttribute("popover", "");
      popover.append(popoverContent);
      return popover;
    }

    return popoverContent;
  }
}

customElements.define("share-button", ShareButton);