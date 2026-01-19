---
description: Clean the project build artifacts to free up space and fix build errors
---

# Clean Project

This workflow cleans the Android and iOS build artifacts and resets the Metro bundler cache.

1. Clean Android Build
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

2. Clean Watchman (Optional)
   ```bash
   watchman watch-del-all
   ```

3. Reset Metro Cache
   ```bash
   npm start -- --reset-cache
   ```
