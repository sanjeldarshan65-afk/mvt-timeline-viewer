#!/usr/bin/env node
import { run } from 'node:test';

await run(['E:/Desktop/CyberOffense/tests/unit/parser.test.js'], {
  timeout: 60000,
  concurrency: 1
});