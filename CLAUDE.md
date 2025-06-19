# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SmartPDFRenamer is a CLI tool that analyzes PDF document content using ChatGPT API and automatically generates file names that comply with Japan's Electronic Bookkeeping Act (電子帳簿保存法). The tool extracts document metadata (date, trading partner, document type, amount) from PDFs and renames them to a standardized format.

## Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Run the CLI tool
npx p2f <path>
# or after build:
node dist/index.js <path>
```

## Code Architecture

### Core Files Structure

- **src/index.ts**: Main CLI entry point with Commander.js configuration and batch processing logic
- **src/chatgpt.ts**: OpenAI API integration for PDF content analysis
- **src/config.ts**: Configuration management with deep merge of default and user settings
- **src/default.ts**: Default configuration values
- **src/project.d.ts**: TypeScript type definitions for the entire project
- **src/spinner.ts**: Terminal spinner utility for user feedback
- **config.json**: User configuration file that overrides defaults

### Key Architecture Patterns

1. **Configuration System**: Uses deep merge to combine default config with user overrides from config.json
2. **CLI Processing**: Handles both single file and directory batch processing with filtering options
3. **Interactive Registration**: Prompts users to register unrecognized trading partners and document types
4. **File Format Validation**: Checks if files already follow the naming convention before processing

### Data Flow

1. PDF files → Base64 encoding → OpenAI API with custom prompt
2. API response → JSON parsing → File rename based on template
3. Unregistered entities → Interactive user prompts → CSV file updates

### Configuration Template Format

The tool uses a configurable filename template: `{date}_{partner}_{documentType}_{amount}.pdf`
- Date format: YYYYMMDD
- Partner: Trading partner name from CSV or AI-extracted
- DocumentType: Document type from CSV or AI-generated
- Amount: Numeric amount without commas

### CSV Data Management

- **trading_partners.csv**: Trading partner names (comma-separated)
- **document_type.csv**: Document types (comma-separated, has defaults)
- Files are created automatically if missing
- New entries are appended during interactive registration

### Environment Requirements

- Requires OPENAI_API_KEY environment variable
- Node.js v18+ recommended
- TypeScript compilation to ES2024/CommonJS