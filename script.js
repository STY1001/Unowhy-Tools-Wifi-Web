const idf = "https://idfconf.s3.gra.io.cloud.ovh.net";
const allsqool = "https://allsqoolconf.s3.gra.io.cloud.ovh.net";
const configurl = "%server%/devices/%sn%/configuration";
// const corsurl = "https://api.cors.lol/?url="; For testing purposes
const corsurl = "https://cors.sty1001.workers.dev/?url=";

async function getNetworkConfig() {
    // Disable the button to prevent multiple clicks and show loading state
    const getBtn = document.getElementById("getbtn");
    getBtn.disabled = true;

    // Hide the result div initially and animate it
    const resultDiv = document.getElementById("resultdiv");
    resultDiv.style.height = resultDiv.scrollHeight + "px";
    resultDiv.style.width = resultDiv.scrollWidth + "px";
    resultDiv.classList.remove("active");
    await new Promise(resolve => setTimeout(resolve, 10));
    resultDiv.style.height = "0px";
    resultDiv.style.width = "0px";

    // Clear the result table
    const resultBody = document.getElementById("resultbody");
    await new Promise(resolve => setTimeout(resolve, 1000));
    resultBody.innerHTML = "";

    // Fetch the network configurations
    const netConfigs = await awaitgetNetworkConfig();

    // If no configurations are found, re-enable the button and return
    if (!netConfigs) {
        getBtn.disabled = false;
        return;
    }

    // Create rows for each network configuration
    let resultIndex = 1;
    netConfigs.forEach(config => {
        const row = document.createElement("tr");
        row.innerHTML = `
                <td>${config.ssid}</td>
                <td>${config.password}</td>
                <td>${config.securityType}</td>
                <td>${config.hidden}</td>
                <td>${config.proxyType}</td>
                <td>${config.proxyIp}</td>
                <td>${config.proxyPort}</td>
                <td>${config.proxyUrl}</td>
            `;
        row.classList.add("animate");
        row.style.animationDelay = `${resultIndex * 0.1}s`;
        resultIndex++;
        resultBody.appendChild(row);
    });

    // Animate the result div to show it
    resultDiv.style.height = resultDiv.scrollHeight + "px";
    resultDiv.style.width = resultDiv.scrollWidth + "px";
    resultDiv.classList.add("active");
    resultDiv.addEventListener("transitionend", function handler(e) {
        if (e.propertyName === "height") {
            resultDiv.removeEventListener("transitionend", handler);
            resultDiv.style.height = "auto"; // Reset height to auto after transition
            resultDiv.style.width = "auto"; // Reset width to auto after transition
        }
    });

    // Re-enable the button after the operation is complete
    getBtn.disabled = false;
    return;
}
async function awaitgetNetworkConfig() {
    // Get the selected server and serial number
    const serverId = document.getElementById("serverselect").value;
    let serverUrl;
    if (serverId === "idf") {
        serverUrl = idf;
    } else if (serverId === "allsqool") {
        serverUrl = allsqool;
    } else {
        alert("Please select a valid server.");
        return;
    }
    const sn = document.getElementById("snbox").value.trim();
    if (sn === "") {
        alert("Please enter a serial number.");
        return;
    }

    // Fetch the configuration for the given serial number
    let configs = await fetch(corsurl + configurl.replace("%server%", serverUrl).replace("%sn%", sn))

    // Delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify if the serial number exists
    if (configs.status !== 200) {
        alert("Serial number not found.");
        return;
    }

    // Get all config topics
    configs = await configs.json();
    let configTopics = [];
    for (const key in configs) {
        configTopics.push(configs[key].url);
    }

    // Get the content of each config topic and merge them
    let mergedConfig = {};
    for (const topic of configTopics) {
        const response = await fetch(corsurl + topic);
        if (response.status === 200) {
            const configData = await response.json();
            mergedConfig = { ...mergedConfig, ...configData };
        } else {
            console.error(`Failed to fetch ${topic}: ${response.statusText}`);
        }
        // Add a delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Get all keys of mergedConfig that start with "conf/network/all/"
    let networkConfigKeys = {};
    for (const key in mergedConfig) {
        if (key.startsWith("conf/network/all/")) {
            networkConfigKeys[key] = mergedConfig[key];
        }
    }

    // Create the array of network configurations
    let networkConfigs = [];
    for (const key in networkConfigKeys) {
        const netPayload = networkConfigKeys[key].payload;
        const netOptions = networkConfigKeys[key].options;
        const netProxy = netOptions.proxy;
        if (netPayload && netOptions && netProxy) {
            let networkConfig = {
                ssid: netOptions.ssid || "",
                password: netOptions.password || "",
                securityType: netOptions.securityType || "",
                hidden: netOptions.hidden ? "True" : "False",
                proxyType: netProxy.type || "",
                proxyIp: netProxy.type === "manual" ? netProxy.proxyHostName || "" : "",
                proxyPort: netProxy.type === "manual" ? netProxy.proxyPort || "" : "",
                proxyUrl: netProxy.type === "automatic" ? netProxy.autoProxyUrl || "" : "",
            };
            networkConfigs.push(networkConfig);
        }
    }

    // Display the network configurations in the result table
    if (networkConfigs.length === 0) {
        alert("No network configurations found.");
        return;
    } else {
        return networkConfigs;
    }
}

let themeState = localStorage.getItem('themeState') || 'system';
function switchTheme() {
    const icon = document.getElementById('themebtnicon');
    const btn = document.getElementById('themebtn');

    if (themeState === 'light') {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        icon.textContent = 'light_mode';
        btn.title = "Theme: Light";
    } else if (themeState === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        icon.textContent = 'dark_mode';
        btn.title = "Theme: Dark";
    } else if (themeState === 'system') {
        const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
        icon.textContent = 'settings_suggest';
        btn.title = "Theme: System";
        if (prefersDarkScheme) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
        }
    }
}

function toggleTheme() {
    if (themeState === 'light') {
        themeState = 'dark';
    } else if (themeState === 'dark') {
        themeState = 'system';
    } else {
        themeState = 'light';
    }

    localStorage.setItem('themeState', themeState); // Store the current theme state in localStorage
    switchTheme();
}

window.matchMedia("(prefers-color-scheme: dark)").addEventListener('change', () => {
    if (themeState === 'system') {
        switchTheme();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    switchTheme();
});