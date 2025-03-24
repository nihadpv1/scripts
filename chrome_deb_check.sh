#!/bin/bash

# Function to check if jq is installed
check_jq_installed() {
    if command -v jq > /dev/null; then
        return 0  # jq is installed
    else
        return 1  # jq is not installed
    fi
}

# Function to install jq
install_jq() {
    echo "Installing jq..."
    sudo apt-get update
    sudo apt-get install -y jq
}

# Function to check if Google Chrome is installed
check_chrome_installed() {
    if command -v google-chrome > /dev/null; then
        return 0  # Chrome is installed
    else
        return 1  # Chrome is not installed
    fi
}

# Function to get the installed version of Google Chrome
get_installed_version() {
    dpkg -s google-chrome-stable | grep '^Version:' | awk '{print $2}'
}

# Function to get the latest version of Google Chrome
get_latest_version() {
    curl -s "https://chromiumdash.appspot.com/fetch_releases?platform=Linux&channel=Stable" | jq -r '.[0].version'
}

# Function to install or update Google Chrome
install_or_update_chrome() {
    echo "Installing/Updating Google Chrome..."
    wget -q -O google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
    sudo dpkg -i google-chrome.deb
    sudo apt-get install -f -y  # Fix any dependency issues
    rm google-chrome.deb
}

# Function to compare version numbers
version_ge() {
    # Compare two version numbers
    dpkg --compare-versions "$1" ge "$2"
}

# Main script execution
if ! check_jq_installed; then
    install_jq
fi

if check_chrome_installed; then
    installed_version=$(get_installed_version)
    latest_version=$(get_latest_version)

    echo "Google Chrome is installed. Version: $installed_version"
    echo "Latest version available: $latest_version"

    if version_ge "$installed_version" "$latest_version"; then
        echo "Google Chrome is up to date. Latest version installed: $installed_version"
    else
        echo "Updating Google Chrome to the latest version..."
        install_or_update_chrome
    fi
else
    echo "Google Chrome is not installed."
    install_or_update_chrome
fi
