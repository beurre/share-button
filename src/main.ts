import { createDarkModeStyles } from "./dark-mode";
import { createPopoverContent } from "./popover";
import { copiedIcon, icons } from "./icons";
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

  render() {
    const title =
      this.getAttribute("data-title") ||
      document.querySelector("title")?.textContent ||
      document.querySelector("h1")?.textContent ||
      "";

    const linkUrl = this.getAttribute("data-url") || window.location.href;
    const copiedLabel = this.getAttribute("data-copied-label") || "Copied!";
    // Get the new data attribute for the copy link label
    const copyLinkLabel = this.getAttribute("data-copy-link-label");

    const userStyles = createUserStyles(this);
    const icon = this.createIcon();
    const isAtomic = this.hasAttribute("atomic");
    // Pass the new copyLinkLabel to createPopover
    const popover = this.createPopover(
      title,
      linkUrl,
      isAtomic,
      copiedLabel,
      copyLinkLabel
    );
    const button = isAtomic ? "" : this.createButton(icon);

    // dark mode
    const darkModeStyles = createDarkModeStyles(this);

    // styles
    const styles = new CSSStyleSheet();
    styles.replaceSync(style + userStyles + darkModeStyles);
    this.shadow.adoptedStyleSheets = [styles];

    const wrapper = document.createElement("div");
    wrapper.setAttribute("class", "wrapper");
    wrapper.setAttribute("part", "share-wrapper");
    const contentEl = this.isPopoverSupport ? popover : "<div></div>";
    wrapper.append(button, contentEl);
    this.shadow.replaceChildren(wrapper);
    let popoverCoords: PopoverCoords = null;

    if (!isAtomic && button) {
      button.addEventListener("click", (e) => {
        const target = e.currentTarget as Element;

        // if mobile and share is supported

        if (this.isMobile) {
          try {
            navigator.share({
              title,
              url: linkUrl,
            });
            target.removeAttribute("popover");
          } catch (err) {
            console.log(err);
          }

          return;
        }

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
          let left = `${
            buttonCoords.left + buttonCoords.width / 2 - popoverCoords.width / 2
          }px`;

          if (buttonCoords.left < 100) {
            left = `${
              buttonCoords.left +
              buttonCoords.width / 2 -
              popoverCoords.width * 0.25
            }px`;
            popover.classList.add("left-adjust");
          }

          if (buttonCoords.right > window.innerWidth - 100) {
            left = `${
              buttonCoords.left +
              buttonCoords.width / 2 -
              popoverCoords.width * 0.75
            }px`;
            popover.classList.add("right-adjust");
          }

          const scrollY = window.scrollY;

          popover.style.left = left;

          if (document.documentElement.clientHeight / 2 > buttonCoords.y) {
            // PUT below
            popover.style.top = `${
              scrollY + buttonCoords.top + buttonCoords.height
            }px`;
            popover.classList.remove("down");
            popover.classList.add("up");
          } else {
            // PUT above
            popover.style.top = `${
              scrollY + buttonCoords.top - popoverCoords.height
            }px`;
            popover.classList.remove("up");
            popover.classList.add("down");
          }

          return;
        }

        navigator.clipboard.writeText(linkUrl);
        setTimeout(() => {
          this.textContent = copiedLabel;
          this.createButton(copiedIcon);
        }, 1000);
      });
    }

    if (!isAtomic) {
      const closePopover = () => {
        const popover = this.shadow.querySelector("[popover]") as HTMLElement;
        popover.hidePopover();
      };

      addEventListener("resize", closePopover);
      addEventListener("scroll", closePopover);
    }
  }

  createIcon() {
    const iconChoice = this.getAttribute("icon") || "1";

    let icon: string;

    if (iconChoice === "false") {
      icon = "";
    } else if (!["1", "2", "3", "4", "5", "6", "7"].includes(iconChoice)) {
      console.log(
        '[Share Button] It looks like you did not specify a valid icon. Please add an icon attribute with a value of "1," "2," "3," "4," "5," "6," or "7"'
      );
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