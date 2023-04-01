# WriteGenius

Authored by gpt-3.5-turbo/gpt-4 with the assistance of a human.

A Chrome extension that uses OpenAI to assist users with their writing tasks. The extension offers three main features: rephrase, summarize, and prompt based on the selected text in Gmail.

## Installation

1. Download the latest release of the extension from the repository (<> Code -> Download Zip) and unzip the archive.

2. In Chrome, go to `chrome://extensions` or open the Extensions page from the Chrome menu.

3. Enable "Developer mode" in the top right corner of the Extensions page.

4. Click the "Load unpacked" button that appears, and then select the unzipped folder of the extension.

5. After installing the extension, make sure to pin it to your Chrome toolbar for easy access. To do this, click the puzzle piece icon in the toolbar, find the WriteGenius extension (![WriteGenius](https://raw.githubusercontent.com/ameer-clara/writegenius/main/assets/search.png "WriteGenius") magnifying glass icon), and click the pin icon next to it.

6. Visit the Settings page of the extension by clicking on the extension icon in the toolbar and then clicking the "Settings" button. Add your OpenAI API key. If you don't have one, you can create a new API key by visting [OpenAI](https://platform.openai.com/account/api-keys) and selecting "Create a new secret key". This is required for the plugin to work.

7. Customize other available settings if needed.

## Usage

To use the extension, simply select the text you want to work with, right-click, and choose one of the following options from the context menu of WriteGenius:

- **Prompt**: Use the selected text as an OpenAI prompt, e.g., "What is 2+2" returns "4"
- **Continue Prompt**: Use the selected text as an OpenAI prompt, e.g., "Repeat last answer" returns "4"
- **Rephrase**: Reword the selected text while retaining its original meaning.
- **Summarize**: Condense the selected text into a shorter version.

After choosing a feature, the extension will send the selected text to OpenAI and display the result in a floating window. You can then replace the selected text with the generated content by clicking the "Replace" button in the floating window.

** Custom Context Menu **

Adding a custom context menu item

1. Click the extension's icon in your browser toolbar to open the settings panel.
2. Fill in the "Title" and "Prompt" fields under "Create Custom Context Menu Item".
3. Click "Create Menu Item". The new item will appear in the "Existing Context Menu Items" table.

Removing a custom context menu item

1. Locate the item you want to remove in the "Existing Context Menu Items" table.
2. Click the red "Remove" button next to the item to remove it.

Using a custom context menu item

1. Simply select the text you want to work with on a web page, right-click and select the custom context menu item under User defined prompts.
2. The custom prompt and the selected text will be sent to OpenAI.
3. View results in the floating window.

## Features

### Prompt

The prompt feature uses the selected text as an OpenAI prompt, enabling you to generate creative and contextually relevant content. For example, you can select the text "Write an email to dispute a bill" and the extension will generate a full email based on your input.

### Continue Prompt

The continue prompt feature uses the selected text as an OpenAI prompt, with remembering the previous conversation.

### Rephrase

This feature rephrases the selected text, providing a new way to express the same idea. This can be helpful for improving clarity, enhancing readability, or avoiding plagiarism.

### Summarize

The summarize feature generates a concise summary of the selected text, helping you to quickly grasp the main points of a longer passage.

Enjoy your new writing companion!

### View History

To view your history of generated content, click on the extension icon (magnifying glass) in the toolbar and select "View History." This will display a list of your previous interactions with the extension, including the rephrased, summarized, and prompted content. You can review and copy the text from your history as needed.

### Custom Context Menu Items

Custom Context Menu Item allows users to create, manage, and quickly access custom context menu items for specific prompts designed for frequent use.
