
(() => {
    "use strict";

    if (window.lendoraPWAInitialized) return;
    window.lendoraPWAInitialized = true;

    const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    const currentPage = window.location.pathname.toLowerCase();
    const isPublicPage = currentPage.endsWith("/apply.html");

    // Select the appropriate manifest.
    const manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.href = isPublicPage
        ? "/manifest-public.webmanifest"
        : "/manifest.webmanifest";

    document.head.appendChild(manifestLink);

    // Register service worker.
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("/sw.js")
                .catch(error => console.error("Service worker error:", error));
        });
    }

    // Do not show popup if already installed.
    if (isStandalone) return;

    let deferredInstallPrompt = null;
    let popupShown = false;

    // Popup styling.
    const style = document.createElement("style");

    style.textContent = `
        #lendora-install-popup {
            position: fixed;
            inset: 0;
            z-index: 999999;
            background: rgba(0,0,0,.55);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .lendora-install-card {
            background: #fff;
            width: 100%;
            max-width: 360px;
            padding: 30px 24px;
            border-radius: 18px;
            text-align: center;
            font-family: Arial, sans-serif;
            box-shadow: 0 10px 35px rgba(0,0,0,.2);
        }

        .lendora-install-icon {
            width: 65px;
            height: 65px;
            object-fit: contain;
            margin-bottom: 12px;
        }

        .lendora-install-card h3 {
            color: #10243a;
            margin: 0 0 10px;
            font-size: 21px;
        }

        .lendora-install-card p {
            color: #64748b;
            font-size: 14px;
            line-height: 1.6;
        }

        #lendora-install-action {
            width: 100%;
            padding: 14px;
            margin-top: 18px;
            background: #10243a;
            color: #fff;
            border: none;
            border-radius: 9px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
        }

        #lendora-install-dismiss {
            display: block;
            margin-top: 17px;
            color: #64748b;
            font-size: 13px;
            cursor: pointer;
        }
    `;

    document.head.appendChild(style);

    function showInstallPopup() {
        if (popupShown || isStandalone) return;

        popupShown = true;

        const popup = document.createElement("div");
        popup.id = "lendora-install-popup";

        let message = "";
        let action = "";

        if (isIOS) {
            message = 'To install Lendora, tap the Share icon in Safari, select "Add to Home Screen", then tap "Add".';
        } else if (deferredInstallPrompt) {
            message = "Install Lendora on your device for quicker and easier access.";
            action = `<button id="lendora-install-action">Install App</button>`;
        } else {
            message = 'Lendora can be installed from your browser menu. Open Chrome menu (⋮) and select "Install app" or "Add to Home screen" when available.';
        }

        popup.innerHTML = `
            <div class="lendora-install-card">
                <img
                    src="/icons/icon-192.png"
                    class="lendora-install-icon"
                    alt="Lendora"
                >

                <h3>Install Lendora</h3>

                <p>${message}</p>

                ${action}

                <span id="lendora-install-dismiss">
                    Maybe later
                </span>
            </div>
        `;

        document.body.appendChild(popup);

        const installButton =
            document.getElementById("lendora-install-action");

        if (installButton) {
            installButton.addEventListener("click", async () => {
                if (!deferredInstallPrompt) return;

                const promptEvent = deferredInstallPrompt;
                deferredInstallPrompt = null;

                promptEvent.prompt();

                try {
                    const result = await promptEvent.userChoice;

                    if (result.outcome === "accepted") {
                        popup.remove();
                    }
                } catch (error) {
                    console.error("Installation error:", error);
                }
            });
        }

        document.getElementById("lendora-install-dismiss")
            .addEventListener("click", () => {
                popup.remove();
            });
    }

    // Capture native installation event.
    window.addEventListener("beforeinstallprompt", event => {
        event.preventDefault();
        deferredInstallPrompt = event;

        // If popup is already visible, update it.
        if (popupShown) {
            document.getElementById("lendora-install-popup")?.remove();
            popupShown = false;
            showInstallPopup();
        }
    });

    // Show popup after page loads.
    window.addEventListener("load", () => {
        setTimeout(showInstallPopup, 2000);
    });

    // Handle successful installation.
    window.addEventListener("appinstalled", () => {
        deferredInstallPrompt = null;

        document.getElementById("lendora-install-popup")?.remove();

        console.log("Lendora installed successfully.");
    });

})();
