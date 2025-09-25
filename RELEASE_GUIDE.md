# 🚀 Release Guide - TELUS Zoho Integration

**How to Release New Versions** | **Triggering Automated Updates**

This guide shows you how to create new releases that will automatically notify users and enable them to update their installations.

---

## 🎯 **Release Process Overview**

When you create a new GitHub release:
1. **Users get notified** automatically in their add-on interface
2. **Update helper** fetches the latest code from GitHub
3. **Version checking** compares their version with your release
4. **Distribution package** gets updated automatically

---

## 📋 **Step-by-Step Release Process**

### **Step 1: Prepare the Release** (5 minutes)

#### **Update Version Number**
1. **Edit `version.gs`:**
```javascript
const ADDON_VERSION = "v2.0.1"; // Update this line
const BUILD_DATE = "2025-09-25T15:30:00Z"; // Update to current date
const COMMIT_HASH = "latest"; // Or actual commit hash
```

#### **Update Distribution Package**
```bash
# Copy updated files to distribution
copy version.gs distribution\v2.0.1\code-files\
copy addon_main.gs distribution\v2.0.1\code-files\
# ... copy any other changed files
```

#### **Test Your Changes**
- ✅ Test all functionality works
- ✅ Verify configuration wizard
- ✅ Test manual sync
- ✅ Check add-on interface

### **Step 2: Commit and Tag** (2 minutes)

```bash
# Commit your changes
git add .
git commit -m "Release v2.0.1: Bug fixes and improvements

- Fixed issue with configuration validation
- Improved error handling in manual sync
- Updated user interface messages
- Enhanced update notification system"

# Create and push tag
git tag -a v2.0.1 -m "Release v2.0.1: Bug fixes and improvements

Changes:
- Fixed configuration validation bug
- Improved error handling
- Enhanced UI messages
- Better update notifications

This release improves stability and user experience."

# Push everything
git push origin workspace-addon
git push origin v2.0.1
```

### **Step 3: Create GitHub Release** (3 minutes)

1. **Go to GitHub Repository**
   - Visit: https://github.com/AlessandroZamai/Zoho
   - Click **"Releases"** tab
   - Click **"Create a new release"**

2. **Fill Release Information:**
   - **Tag version**: `v2.0.1` (select existing tag)
   - **Release title**: `v2.0.1: Bug fixes and improvements`
   - **Description**:
   ```markdown
   ## 🔄 What's New in v2.0.1

   ### 🐛 Bug Fixes
   - Fixed configuration validation issue that prevented setup completion
   - Resolved manual sync error handling
   - Corrected timezone handling in campaign dates

   ### ✨ Improvements
   - Enhanced user interface messages for better clarity
   - Improved error notifications in add-on interface
   - Better update notification system
   - Optimized performance for large spreadsheets

   ### 📋 Installation
   - **New Users**: Follow the [Installation Guide](https://github.com/AlessandroZamai/Zoho/blob/workspace-addon/ENHANCED_INSTALLATION_GUIDE.md)
   - **Existing Users**: Use the update helper in your add-on or follow the [Update Guide](https://github.com/AlessandroZamai/Zoho/blob/workspace-addon/UPDATE_GUIDE.md)

   ### 🔗 Quick Links
   - [Distribution Package](https://github.com/AlessandroZamai/Zoho/tree/workspace-addon/distribution/v2.0.1)
   - [Installation Guide](https://github.com/AlessandroZamai/Zoho/blob/workspace-addon/ENHANCED_INSTALLATION_GUIDE.md)
   - [Update Guide](https://github.com/AlessandroZamai/Zoho/blob/workspace-addon/UPDATE_GUIDE.md)

   **Installation Time**: ~12 minutes | **No GCP setup required**
   ```

3. **Attach Distribution Package** (Optional)
   - Create ZIP of `distribution/v2.0.1/` folder
   - Attach as release asset

4. **Publish Release**
   - Click **"Publish release"**

---

## 🔄 **What Happens After Release**

### **Immediate Effects:**
1. **GitHub API** updates with new latest release
2. **Users' add-ons** will detect the update next time they check status
3. **Update notifications** appear in their interface
4. **Update helper** can fetch the new code

### **User Experience:**
1. User opens add-on → **Views Status**
2. Sees **"🔄 Update Available"** notification
3. Clicks **"Get Update Helper"**
4. Selects files to update
5. Copies code from logs and updates their files

---

## 📋 **Release Types and Versioning**

### **Semantic Versioning (Recommended)**
- **v2.0.1** - Patch: Bug fixes, small improvements
- **v2.1.0** - Minor: New features, backward compatible
- **v3.0.0** - Major: Breaking changes, requires reconfiguration

### **Release Frequency**
- **Patch releases**: As needed for bug fixes
- **Minor releases**: Monthly for new features
- **Major releases**: Quarterly or as needed

---

## 🛠 **Advanced Release Automation**

### **Option 1: GitHub Actions (Future Enhancement)**
Create `.github/workflows/release.yml`:
```yaml
name: Create Release
on:
  push:
    tags:
      - 'v*'
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

### **Option 2: Automated Distribution Package**
Script to automatically update distribution package:
```bash
#!/bin/bash
VERSION=$1
mkdir -p distribution/$VERSION/code-files
mkdir -p distribution/$VERSION/documentation
mkdir -p distribution/$VERSION/templates

# Copy code files
cp *.gs distribution/$VERSION/code-files/
cp appsscript.json distribution/$VERSION/code-files/

# Copy documentation
cp *_GUIDE.md distribution/$VERSION/documentation/
cp README.md distribution/$VERSION/documentation/

# Copy templates
cp *.csv distribution/$VERSION/templates/

echo "Distribution package created for $VERSION"
```

---

## 📋 **Release Checklist**

### **Pre-Release:**
- [ ] Update version number in `version.gs`
- [ ] Test all functionality
- [ ] Update documentation if needed
- [ ] Create/update distribution package
- [ ] Write release notes

### **Release:**
- [ ] Commit all changes
- [ ] Create and push git tag
- [ ] Create GitHub release
- [ ] Add release notes
- [ ] Attach distribution package (optional)
- [ ] Publish release

### **Post-Release:**
- [ ] Test update notification system
- [ ] Verify update helper works
- [ ] Monitor for user feedback
- [ ] Update internal documentation

---

## 🧪 **Testing the Release Process**

### **Test Update Detection:**
1. Create a test release (e.g., `v2.0.1-test`)
2. Open your add-on
3. Go to **View Status**
4. Check if update notification appears
5. Test the update helper functionality

### **Test Code Fetching:**
1. Click **"Get Update Helper"**
2. Select a file (e.g., `version.gs`)
3. Check Apps Script logs
4. Verify latest code is displayed

---

## 🆘 **Troubleshooting Releases**

### **Update Not Detected:**
- ✅ Check GitHub release is published (not draft)
- ✅ Verify tag format matches (e.g., `v2.0.1`)
- ✅ Test GitHub API: `https://api.github.com/repos/AlessandroZamai/Zoho/releases/latest`

### **Code Fetching Fails:**
- ✅ Check file exists in repository
- ✅ Verify branch name in URL (workspace-addon)
- ✅ Test raw URL directly in browser

### **Version Comparison Issues:**
- ✅ Ensure version format is consistent
- ✅ Check `version.gs` has correct version number
- ✅ Verify semantic versioning format

---

## 📞 **Quick Reference**

### **Release Commands:**
```bash
# Update version and commit
git add .
git commit -m "Release v2.0.1: Description"

# Create and push tag
git tag -a v2.0.1 -m "Release v2.0.1"
git push origin workspace-addon
git push origin v2.0.1

# Then create GitHub release manually
```

### **Testing Commands:**
```javascript
// Test in Apps Script console
checkForUpdates()              // Check for updates
getLatestFileCode("version.gs") // Test file fetching
showUpdateHelper()             // Show available files
```

### **API Endpoints:**
- **Latest Release**: `https://api.github.com/repos/AlessandroZamai/Zoho/releases/latest`
- **Raw Files**: `https://raw.githubusercontent.com/AlessandroZamai/Zoho/workspace-addon/filename.gs`

---

## 🎉 **You're Ready to Release!**

The release process is now streamlined and will automatically notify users of updates. Each release you create will:

1. ✅ **Trigger update notifications** for all users
2. ✅ **Enable automatic code fetching** via update helper
3. ✅ **Provide professional release notes** and documentation
4. ✅ **Maintain version control** and update history

Your users will have a professional update experience while you maintain full control over the release process!
