# DigiCloset — API Reference Documentation

All API endpoints are prefixed with `/api`. Authenticated endpoints require an `Authorization: Bearer <FIREBASE_ID_TOKEN>` header.

---

## 1. Authentication (`/api/auth`)

### Synchronize User
Syncs a Firebase-authenticated user into the MongoDB database upon login/signup.

- **URL:** `/api/auth/sync`
- **Method:** `POST`
- **Auth Required:** Yes (`Bearer <token>`)
- **Body:**
  ```json
  {
    "displayName": "Alex Morgan",
    "photoURL": "https://example.com/avatar.jpg"
  }
  ```
- **Response `200`:**
  ```json
  {
    "success": true,
    "user": {
      "id": "670d8a...",
      "firebaseUid": "abcd1234efgh",
      "email": "alex@example.com",
      "displayName": "Alex Morgan",
      "styleProfile": {}
    }
  }
  ```

### Get Current User
- **URL:** `/api/auth/me`
- **Method:** `GET`
- **Auth Required:** Yes
- **Response `200`:** User profile object including permissions and timestamp.

---

## 2. User Profile & Settings (`/api/profile`)

### Get Profile
- **URL:** `/api/profile`
- **Method:** `GET`
- **Auth Required:** Yes
- **Response `200`:** Returns full user profile including faceShape, height, weight, sizes, preferences.

### Update Profile
- **URL:** `/api/profile`
- **Method:** `PUT`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "displayName": "Alex Morgan",
    "styleProfile": {
      "faceShape": "oval",
      "heightCm": 178,
      "weightKg": 70,
      "shirtSize": "M",
      "pantSize": "32",
      "shoeSize": "10",
      "favoriteColors": ["navy", "olive", "beige"],
      "preferredStyles": ["minimalist", "casual"],
      "avoidColors": ["neon"]
    }
  }
  ```

### Export User Data (GDPR Compliance)
- **URL:** `/api/profile/export`
- **Method:** `POST`
- **Auth Required:** Yes
- **Response `200`:** Complete JSON dump containing user profile, wardrobe items, saved outfits, and shopping lists.

### Delete Account & All Data
- **URL:** `/api/profile/account`
- **Method:** `DELETE`
- **Auth Required:** Yes
- **Response `200`:** Confirms permanent deletion of user document and all associated wardrobe/outfit/shopping records.

---

## 3. Digital Wardrobe (`/api/wardrobe`)

### List Wardrobe Items
- **URL:** `/api/wardrobe`
- **Method:** `GET`
- **Auth Required:** Yes
- **Query Parameters:**
  - `category` *(optional)*: `tops`, `bottoms`, `shoes`, `outerwear`, `accessories`
  - `season` *(optional)*: `spring`, `summer`, `fall`, `winter`, `all-season`
- **Response `200`:** Array of clothing items.

### Add Wardrobe Item
- **URL:** `/api/wardrobe`
- **Method:** `POST`
- **Auth Required:** Yes
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `name`: String (e.g., "Navy Oxford Shirt")
  - `category`: String (`tops`, `bottoms`, `shoes`, etc.)
  - `color`: String (e.g., "Navy")
  - `image`: File (JPEG, PNG, WebP)
  - `season`: String *(optional)*
  - `occasion`: String *(optional)*
  - `tags`: Comma-separated strings *(optional)*

### Update Wardrobe Item
- **URL:** `/api/wardrobe/:id`
- **Method:** `PUT`
- **Auth Required:** Yes

### Delete Wardrobe Item
- **URL:** `/api/wardrobe/:id`
- **Method:** `DELETE`
- **Auth Required:** Yes

---

## 4. AI Outfit Recommendations (`/api/outfits`)

### Generate Outfit Recommendations
- **URL:** `/api/outfits/recommend`
- **Method:** `POST`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "occasion": "casual",
    "weather": { "temperature": 22, "condition": "sunny" },
    "style": "minimalist"
  }
  ```
- **Response `200`:**
  ```json
  {
    "success": true,
    "mode": "gemini-ai",
    "recommendations": [
      {
        "id": "outfit-1",
        "title": "Clean Monochrome Casual",
        "description": "A breathable ensemble suited for 22°C sunny weather.",
        "items": [...],
        "stylingTips": "Keep accessories minimal with a silver watch."
      }
    ]
  }
  ```

### Save Outfit
- **URL:** `/api/outfits/saved`
- **Method:** `POST`
- **Auth Required:** Yes

### Get Saved Outfits
- **URL:** `/api/outfits/saved`
- **Method:** `GET`
- **Auth Required:** Yes

### Delete Saved Outfit
- **URL:** `/api/outfits/saved/:id`
- **Method:** `DELETE`
- **Auth Required:** Yes

---

## 5. AI Fashion Critic (`/api/fashion`)

### Critique Outfit
- **URL:** `/api/fashion/critique`
- **Method:** `POST`
- **Auth Required:** Yes
- **Content-Type:** `multipart/form-data` or `application/json`
- **Fields:**
  - `image`: *(optional)* Uploaded outfit photo
  - `occasion`: Expected occasion or context
  - `itemIds`: *(optional)* Array of wardrobe item IDs
- **Response `200`:**
  ```json
  {
    "success": true,
    "score": 8.5,
    "verdict": "Sophisticated with strong proportions",
    "strengths": ["Excellent color balance", "Well-fitted trousers"],
    "improvements": ["Try a structured leather belt to anchor the waist"],
    "colorHarmony": "Complementary blue and cognac",
    "mode": "gemini-ai"
  }
  ```

---

## 6. Color Analyzer (`/api/colors`)

### Analyze Color Harmony
- **URL:** `/api/colors/analyze`
- **Method:** `POST`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "primaryColor": "#1E3A8A",
    "secondaryColors": ["#F3F4F6", "#D97706"]
  }
  ```
- **Response `200`:** Returns harmony rating (0-100), harmony rule applied (monochromatic, complementary, triadic), and suggested accent colors.

---

## 7. Occasion Styling (`/api/styling`)

### Recommend by Occasion
- **URL:** `/api/styling/recommend`
- **Method:** `POST`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "occasion": "wedding-guest",
    "formality": "semi-formal",
    "dressCode": "Cocktail Attire",
    "weather": "mild"
  }
  ```

---

## 8. Smart Product Search (`/api/products`)

### Search & Filter Products
- **URL:** `/api/products`
- **Method:** `GET`
- **Auth Required:** No
- **Query Parameters:**
  - `q`: Search query text
  - `category`: `tops`, `bottoms`, `shoes`, `outerwear`, etc.
  - `minPrice`: Number
  - `maxPrice`: Number
  - `sort`: `price_asc`, `price_desc`, `rating`
- **Response `200`:** List of catalog products with price, rating, brand, and affiliate/dev links.

### Save / Bookmark Product
- **URL:** `/api/products/saved`
- **Method:** `POST`
- **Auth Required:** Yes
- **Body:** `{ "productId": "..." }`

---

## 9. Budget Shopping Assistant (`/api/shopping`)

### Generate AI Shopping Plan
- **URL:** `/api/shopping/plan`
- **Method:** `POST`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "budget": 200,
    "wardrobeGaps": ["Lightweight summer blazer", "White leather sneakers"],
    "targetOccasion": "Smart Casual Workwear"
  }
  ```

### Manage Shopping Lists
- **URL:** `/api/shopping/lists`
- **Methods:** `GET`, `POST`, `PUT`, `DELETE`
- **Auth Required:** Yes

---

## 10. Virtual Try-On (`/api/try-on`)

### Submit Try-On Job
- **URL:** `/api/try-on/submit`
- **Method:** `POST`
- **Auth Required:** Yes
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `userPhoto`: Full-length person photo
  - `clothingPhoto` or `clothingItemId`: Clothing garment to try on
- **Response `200`:**
  ```json
  {
    "success": true,
    "jobId": "tryon-670d8a...",
    "status": "completed",
    "fitAnalysis": {
      "overallFit": "Tailored Regular",
      "silhouetteCompatibility": "High",
      "recommendations": "Sleeve length matches shoulder breadth well."
    }
  }
  ```

### Get Job Status
- **URL:** `/api/try-on/:id`
- **Method:** `GET`
- **Auth Required:** Yes

---

## 11. AI Fashion Chatbot (`/api/chat`)

### Send Chat Message
- **URL:** `/api/chat`
- **Method:** `POST`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "message": "What should I wear for an outdoor brunch this Saturday?",
    "includeWardrobeContext": true
  }
  ```
- **Response `200`:** Assistant reply with contextual wardrobe references.

### Clear Conversation History
- **URL:** `/api/chat/history`
- **Method:** `DELETE`
- **Auth Required:** Yes

---

## 12. Weather Service (`/api/weather`)

### Get Current Weather
- **URL:** `/api/weather/current`
- **Method:** `GET`
- **Auth Required:** No
- **Query Parameters:**
  - `latitude`: Float (e.g., `40.7128`)
  - `longitude`: Float (e.g., `-74.0060`)
- **Response `200`:** Current temperature, wind speed, condition code, and clothing tips.
