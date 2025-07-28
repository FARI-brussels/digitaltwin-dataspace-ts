#!/usr/bin/env node

import {spawn} from 'child_process'
import {platform} from 'os'

// Call digitaltwin-cli with all arguments
const args = process.argv.slice(2)

// Handle Windows compatibility
const isWindows = platform() === 'win32'
const command = isWindows ? 'npx.cmd' : 'npx'
const spawnOptions = {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: isWindows
}

const child = spawn(command, ['digitaltwin-cli', ...args], spawnOptions)

child.on('error', (error) => {
    console.error('❌ Failed to execute digitaltwin-cli:', error.message)
    process.exit(1)
})

child.on('exit', (code) => {
    process.exit(code || 0)
})