<h1 align="center">FillMyForm</h1>

<p align = "center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Chrome_Extension-4285F4?style=flat&logo=googlechrome&logoColor=white" alt="Chrome Extension"/>
  <img src="https://img.shields.io/badge/HTML-E34F26?style=flat&logo=html5&logoColor=white" alt="HTML"/>
  <img src="https://img.shields.io/badge/CSS-1572B6?style=flat&logo=css3&logoColor=white" alt="CSS"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat" alt="MIT License"/>
</p>

FillMyForm is a browser extension that keeps your details in profiles and fills long, tedious forms in one click. Set up a profile once, pick it from the extension popup, and the form fills itself. Everything is stored locally in your browser.


## Live Demo Video

Demo: [Here](https://drive.google.com/file/d/1s8X8mNem5TYBNx56bBD2sSksYEtp4Z2g/view?usp=sharing)


## Features
- **One click filling** fills every field it recognizes on the page
- **Multiple Profiles** so you can keep work and personal details separate
- **Local storage only** as your data never leaves your browser
- **Custom fields** let you add anything the default fields do not cover
- **Alternate values**  for fields liek a second email or phone number, with a small picker on the page to switch between them
- **Match highlighting** shows a green outline for exact matches and a yellow outline for close matches worth a second look 
- **Import and export** to back up a profile as a JSON file or mve it to another browser
- **Never submits** as the extension onlu fills fields, and you review the form yourself


## Tech Stack

- **Language:** TypeScript
- **Bundler:** Vite
- **Platform** Chrome extension (Manfiest v3), popup, options page and content script
- **Storage:** `chrome.storgae.local`
- **Frontend:** HTML and CSS

## What is does 

You create a profile and fill in the detials you type most often: name, email, phone, adress, date of birth and anything else you add. When you open a form. choose a profile in the popup and click Fill my form. The extension reads the label on the page, matches them to your profile fields and fills the ones it recognizes.

V1 supports standard HTML form fields. Google Forms, Tally, Fillout and other form buildres are planned for later versions.


## How to use it

1. Open Manage Profiles from the popup and create a profile.
2. Fill in your details and click Save profile.
3. Open a page with a form, or use the sample form from the popup.
4. Select the profile in the popup and click Fill my form.
5. Review the filled fileds before you submit.

## Running it on yo pc

Clone the repo: 

```
git clone https://github.com/raze-me/fillmyform
cd fillmyform
```

Install the dependencies:

```
npm install
```

Build the extension:

```
npm run build
```

The production extension is generated in the `dist/` folder.

Load it in Chrome:

1. Open `chrome://extensions`
2. Turn on Developer Mode
3. Click load unpacked button
4. select the `dist` folder


## Project structure
 
```
manifest.json             Extension manifest
vite.config.ts            Vite build configuration
src/
    background/
        background.ts     Background script
    content/
        content.ts        Runs on the page and fills the form
    lib/
        extractor.ts      Finds form fields and works out their labels
        matcher.ts        Matches page labels to profile fields
        filler.ts         Writes values, highlights fields and adds the value picker
        schema.ts         Profile and field types
        storage.ts        Reads and writes profiles in chrome.storage.local
    options/
        options.html      Profile manager page
        options.ts        Profile editing, import and export
    popup/
        popup.html        Extension popup
        popup.ts          Profile selection and the fill button
public/
    test-form.html        Sample form for testing
```


## How matching works

The contnet script collects every input, select and textarea on the page and works out a label for each one. It checks in order, the linked `<label>`, a wraping label, `aria-labelledby`, nearby text, the placeholder, and finally the field's `name` or `id`.

Each label is then matches to a profile field. If the input has an `autocomplete` attribute, that is used first and counts as an exact match. Otherwise the label is cleaned up and compared against each profile field's name and synonmys. An identical match is exact and it will get outlined. if there is no identical match. the closest one is used when it is similar enough and it gets a yellow outline so you know to check it. when a field has more than one saved value, the first is filled and a small picker lets your switch.


**All data is saved locally and nothing is being saved outside the user's browser**

## Testing 

1. Create a profile.
2. Open the sample tes form from the popup.
3. select the profile in the extension 
4. click fill my form.
5. Review the populated fields.


## Requirements
 
Node.js 20.19 or later and a Chromium based browser.
 
## License
 
MIT
 
## Authors
 
Built by
- [@raze-me](https://github.com/raze-me)
- [@rexaintreal](https://github.com/rexaintreal)
