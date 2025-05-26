# @brobridge/atomic-file

A comprehensive file operation module for Brobridge Atomic platform, providing Node-RED nodes for reading and writing files with advanced features like flow control, multiple encodings, and streaming capabilities.

## Overview

The atomic-file module extends Node-RED with powerful file handling capabilities, designed specifically for the Brobridge Atomic ecosystem. It provides two main nodes:

- **Read File**: Advanced file reading with multiple output modes and flow control
- **Write File**: Efficient file writing with encoding support and stream management

## Features

### Read File Node
- **Multiple Output Modes**: String, line-by-line, buffer, and buffer stream
- **Encoding Support**: Wide range of character encodings (UTF-8, Asian languages, legacy encodings)
- **Flow Control**: Built-in flow control for handling large files without memory issues
- **Batch Processing**: Line batching for efficient processing of large text files
- **Stream Management**: Intelligent buffering and stream handling

### Write File Node
- **Multiple Data Types**: Automatic handling of strings, buffers, objects, numbers, and booleans
- **Encoding Support**: Same comprehensive encoding support as Read File
- **Stream Optimization**: Efficient stream reuse and management
- **Directory Management**: Automatic directory creation
- **File Modes**: Both overwrite and append modes supported

## Installation

```bash
npm install @brobridge/atomic-file
```

## Dependencies

- Node.js >= 18
- Node-RED >= 2.0.0
- @brobridge/atomic-flowcontrol ^0.0.1
- @brobridge/atomic-sdk ^0.0.2
- iconv-lite ^0.6.3

## Configuration

### Read File Node

#### Basic Settings
- **Name**: Optional node name for identification
- **Filename**: File path (static, from message, or environment variable)
- **Encoding**: Character encoding (default, UTF-8, or various international encodings)
- **Buffer Size**: Read buffer size in bytes (default: 65,536)

#### Output Modes
1. **Single UTF-8 String**: Reads entire file as one string message
2. **Line by Line**: Outputs each line as separate message
3. **Single Buffer**: Reads entire file as one buffer message
4. **Buffer Stream**: Streams file as buffer chunks

#### Line Output Options
- **Single Output**: Each line sent individually
- **Batch Output**: Multiple lines sent as array
- **Max Lines per Batch**: Configurable batch size (default: 1000)

#### Flow Control
- **Enable/Disable**: Flow control for large file processing
- Requires Flow Control node when enabled

### Write File Node

#### Basic Settings
- **Name**: Optional node name
- **Filename**: Target file path
- **Encoding**: Output encoding

#### File Handling
- **Overwrite**: Replace entire file content vs. append mode
- **Auto-Create Directory**: Automatically create parent directories
- **Append Newline**: Add newline character after each write

## Usage Examples

### Basic File Reading

```javascript
// Read entire file as string
msg.filename = "/path/to/file.txt";
// Node outputs: msg.payload = "file contents as string"
```

### Line-by-Line Processing with Flow Control

```javascript
// Configure Read File node:
// - Output Mode: "Line by Line"
// - Flow Control: "Enable"
// - Connect to Flow Control node

// Each line sent as separate message:
// msg.payload = "line 1 content"
// msg.payload = "line 2 content"
// ...
```

### Batch Line Processing

```javascript
// Configure Read File node:
// - Output Mode: "Line by Line" 
// - Output Format: "Batch"
// - Max Lines per Batch: 100

// Output: msg.payload = ["line1", "line2", ..., "line100"]
```

### Writing Files

```javascript
// Simple write
msg.payload = "Hello World";
msg.filename = "/path/to/output.txt";

// Object write (auto-converted to JSON)
msg.payload = { name: "John", age: 30 };

// Append mode with newlines
// Configure: Overwrite=false, Append Newline=true
```

### Stream Processing Large Files

```javascript
// For large files, use buffer stream mode:
// - Output Mode: "Buffer Stream"
// - Flow Control: "Enable"
// - Buffer Size: 8192 (smaller chunks)

// Outputs multiple buffer chunks without loading entire file
```

## Message Properties

### Input Messages

#### Read File
- `msg.filename` (string): File path when filename type is "msg"
- `msg.payload.filename` (string): Alternative filename location
- `msg.env` (object): Environment variables when filename type is "env"

#### Write File
- `msg.payload` (any): Data to write to file
- `msg.filename` (string): Target file path when filename type is "msg"
- `msg.env` (object): Environment variables when filename type is "env"

### Output Messages

#### Read File
- `msg.payload` (string|buffer|array): File content based on output mode
- `msg.atomicSession` (string): Session ID when flow control is enabled

#### Write File
- `msg` (object): Original message passed through after successful write

## Supported Encodings

The module supports a comprehensive range of character encodings:

- **Native**: UTF-8, UCS-2, UTF-16LE, ASCII, Binary, Base64, Hex
- **Unicode**: UTF-16BE
- **Japanese**: Shift_JIS, Windows-31j, Windows932, EUC-JP
- **Chinese**: GB2312, GBK, GB18030, Windows936, EUC-CN
- **Korean**: KS_C_5601, Windows949, EUC-KR
- **Taiwan/HK**: Big5, Big5-HKSCS, Windows950
- **Windows**: CP874, CP1250-1258
- **ISO**: ISO-8859-1 through ISO-8859-16
- **IBM**: Various CP encodings
- **Mac**: Mac regional encodings
- **KOI8**: KOI8-R, KOI8-U, KOI8-RU, KOI8-T
- **Miscellaneous**: ARMSCII8, RK1048, TCVN, and others

## Error Handling

### Common Errors

#### Read File
- **File not found**: When specified file doesn't exist
- **File is directory**: When path points to directory instead of file
- **Permission denied**: When insufficient read permissions
- **Memory exhaustion**: When reading large files without streaming

#### Write File
- **No filename specified**: When filename is empty or undefined
- **Directory doesn't exist**: When auto-create is disabled and parent directory is missing
- **File is directory**: When target path points to existing directory
- **Permission denied**: When insufficient write permissions

### Best Practices

1. **Large Files**: Use streaming modes (line-by-line or buffer stream) for files > 100MB
2. **Flow Control**: Enable flow control for any streaming operation to prevent memory issues
3. **Encoding**: Specify correct encoding for non-UTF-8 files
4. **Error Handling**: Always connect error handling nodes for file operations
5. **Directory Management**: Enable auto-create directory for dynamic file paths

## Performance Considerations

- **Buffer Size**: Adjust buffer size based on file size and available memory
- **Stream Management**: File streams are automatically managed and reused for 3 seconds
- **Batch Processing**: Use batch mode for processing many small lines efficiently
- **Flow Control**: Essential for processing large files without blocking Node-RED

## Node-RED Integration

This module integrates seamlessly with Node-RED's flow-based programming model:

- Compatible with Node-RED >= 2.0.0
- Follows Node-RED node development best practices
- Supports Node-RED's typing system and validation
- Includes comprehensive help documentation
- Provides both English and Traditional Chinese locales

## License

Apache License 2.0

## Repository

- **Homepage**: https://github.com/BrobridgeOrg/atomic-file
- **Issues**: https://github.com/BrobridgeOrg/atomic-file/issues
- **Repository**: https://github.com/BrobridgeOrg/atomic-file.git

## Author

Fred Chien <fred@brobridge.com>
