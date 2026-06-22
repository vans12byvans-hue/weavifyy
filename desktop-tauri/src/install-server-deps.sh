#!/bin/bash

echo "========================================"
echo "Installing server dependencies..."
echo "========================================"

echo ""
echo "[1/3] Installing backend dependencies..."
cd ../backend
npm install --production
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    exit 1
fi

echo ""
echo "[2/3] Installing youtube-audio-server dependencies..."
cd ../youtube-audio-server
npm install --production
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install youtube-audio-server dependencies"
    exit 1
fi

echo ""
echo "[3/3] Installing telegram-bot dependencies..."
cd ../telegram-bot
npm install --production
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install telegram-bot dependencies"
    exit 1
fi

cd ../desktop

echo ""
echo "========================================"
echo "All server dependencies installed!"
echo "========================================"
echo ""
