# Quick Testing Guide - Three New Features

## 🚀 Start Both Servers

### Terminal 1 - Backend
```bash
cd c:\Astrology\AstroAI\server\AstroAI.Api
dotnet run
```
Expected: `Now listening on: http://localhost:5089` (or similar port)

### Terminal 2 - Frontend
```bash
cd c:\Astrology\AstroAI\astroai-ui
ng serve
```
Expected: `Angular Live Development Server is listening on localhost:4200`

---

## 🧪 Test Scenarios

### 1. AI Match Making Test
**URL**: http://localhost:4200/matchmaking

**Person 1**:
- Name: Rahul Sharma
- Birth Date: 1990-05-15
- Birth Time: 14:30
- Birth Place: Mumbai, Maharashtra, India

**Person 2**:
- Name: Priya Patel
- Birth Date: 1992-08-22
- Birth Time: 09:15
- Birth Place: Ahmedabad, Gujarat, India

**Expected Result**:
- Compatibility score (0-100)
- Kuta score (0-36)
- Synastry analysis paragraph
- 7 compatibility areas with scores
- Strengths list
- Challenges list
- Recommendations
- Next steps

**Check For**:
- ✅ Pink/purple gradient background
- ✅ Score circle with color coding (green/yellow/red)
- ✅ Responsive layout
- ✅ Loading spinner during analysis
- ✅ Reset button works

---

### 2. Yearly Horoscope Test
**URL**: http://localhost:4200/yearly-horoscope

**Input**:
- Name: Amit Kumar
- Target Year: 2025 (select from dropdown)
- Birth Date: 1988-12-10
- Birth Time: 06:45
- Birth Place: Delhi, Delhi, India

**Expected Result**:
- Overall theme for 2025
- 5 life area cards with score bars (1-10):
  - Career
  - Finance
  - Relationships
  - Health
  - Spiritual Growth
- 12 monthly highlight cards with 4 aspects each
- Important dates timeline
- Recommended remedies list

**Check For**:
- ✅ Purple gradient background
- ✅ Rotating star icon animation
- ✅ Score bars with dynamic colors
- ✅ Monthly grid responsive layout
- ✅ Year dropdown shows current-1 to current+5
- ✅ Reset button works

---

### 3. Personalized Remedies Test
**URL**: http://localhost:4200/remedies

**Input**:
- Name: Sneha Reddy
- Birth Date: 1995-03-18
- Birth Time: 11:20
- Birth Place: Hyderabad, Telangana, India
- Areas of Concern: Check 3 boxes:
  - ☑ Career
  - ☑ Health
  - ☑ Finance

**Expected Result**:
- Chart summary paragraph
- Tabbed interface with 6 categories:
  - 🔮 Mantras
  - 💎 Gemstones
  - 🌙 Fasting Days
  - 🕉️ Rituals
  - 🙏 Donations
  - ⚖️ Lifestyle
- Each tab shows remedy cards with:
  - Effectiveness badge (1-10)
  - Description
  - How to perform
  - Best time
- Immediate actions section (highlighted)

**Check For**:
- ✅ Pink/red gradient background
- ✅ Glowing icon animation
- ✅ Checkbox grid for concerns
- ✅ Tab badges show count
- ✅ Remedy cards have hover effects
- ✅ Effectiveness badges color-coded
- ✅ Reset button works

---

## 🐛 Common Issues & Fixes

### Issue 1: CORS Error
**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Fix**: In backend `Program.cs`, ensure CORS is configured:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

app.UseCors("AllowAngular");
```

### Issue 2: API Not Found (404)
**Error**: `GET http://localhost:4200/api/... 404 (Not Found)`

**Fix**: Check environment.ts has correct API base URL:
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5089'  // Match backend port
};
```

### Issue 3: Module Not Found
**Error**: `Can't resolve './components/matchmaking/matchmaking.component'`

**Fix**: Ensure all component files exist:
```
astroai-ui/src/app/components/matchmaking/
  matchmaking.component.ts
  matchmaking.component.html
  matchmaking.component.scss
  matchmaking.component.spec.ts
```

### Issue 4: OpenAI API Error
**Error**: `Failed to generate... Please try again`

**Fix**: Check appsettings.json has valid OpenAI configuration:
```json
{
  "AstroAi": {
    "OpenAI": {
      "ApiKey": "your-actual-api-key",
      "Endpoint": "https://your-endpoint.openai.azure.com/",
      "DeploymentName": "your-deployment-name",
      "ApiVersion": "2024-08-01-preview"
    }
  }
}
```

---

## ✅ Success Indicators

### Frontend (Browser Console)
- **No red errors** in console (F12)
- **Network tab** shows:
  - POST requests to API endpoints
  - Status 200 responses
  - JSON response bodies

### Backend (Terminal)
- **No exceptions** logged
- **Info logs** showing:
  - Chart generation
  - Dasha calculation
  - GPT API calls
  - Successful responses

---

## 📊 Performance Benchmarks

**Expected Response Times**:
- Matchmaking: 8-12 seconds (2 charts + GPT)
- Yearly Horoscope: 10-15 seconds (complex prompt)
- Remedies: 6-10 seconds (chart + remedies)

**GPT Token Usage** (approximate):
- Matchmaking: 1500-2000 tokens
- Yearly Horoscope: 2000-2500 tokens
- Remedies: 1200-1800 tokens

---

## 🔍 Debugging Commands

### Check Backend Health
```bash
curl http://localhost:5089/weatherforecast
```
Expected: JSON array of weather forecasts

### Check Angular Build
```bash
cd astroai-ui
ng build --configuration development
```
Expected: Build success message

### Check Backend Controllers
```bash
dotnet watch run --project server/AstroAI.Api
```
Watches for file changes and auto-reloads

---

## 📱 Mobile Testing

### Responsive Breakpoints
- **Desktop**: Full layout (1200px+)
- **Tablet**: Adjusted grids (768px - 1199px)
- **Mobile**: Stacked layout (<768px)

### Browser DevTools
1. Press F12
2. Click device toolbar icon
3. Test on:
   - iPhone 12 Pro (390x844)
   - iPad Air (820x1180)
   - Galaxy S20 (360x800)

---

## 📈 What to Look For

### Visual Quality
- ✅ Smooth animations
- ✅ Consistent spacing
- ✅ Readable fonts
- ✅ Color contrast (accessibility)
- ✅ Icons load properly

### Functionality
- ✅ Forms validate before submission
- ✅ Loading states show during API calls
- ✅ Error messages display clearly
- ✅ Results render completely
- ✅ Reset clears all state

### Data Accuracy
- ✅ Scores are within expected ranges
- ✅ Dates format correctly
- ✅ Names appear in responses
- ✅ All sections populated
- ✅ No "undefined" or "null" text

---

## 🎯 Test Checklist

### Matchmaking
- [ ] Both person forms accept input
- [ ] Validation prevents empty submission
- [ ] Loading spinner shows during analysis
- [ ] Score circle displays with correct color
- [ ] All compatibility areas render
- [ ] Strengths and challenges populate
- [ ] Recommendations display
- [ ] Reset button clears results

### Yearly Horoscope
- [ ] Year dropdown has 7 years
- [ ] All birth fields required
- [ ] Overall theme displays
- [ ] 5 life areas show with score bars
- [ ] 12 monthly cards render
- [ ] Important dates timeline displays
- [ ] Remedies list populates
- [ ] Reset button clears results

### Remedies
- [ ] 8 concern checkboxes render
- [ ] At least 1 concern required
- [ ] Chart summary displays
- [ ] Tab system works
- [ ] Badge counts show correctly
- [ ] Remedy cards display in active tab
- [ ] Effectiveness badges color-coded
- [ ] Immediate actions highlighted
- [ ] Reset button clears results

---

## 🚀 After Testing

If all tests pass, you're ready to:
1. ✅ Deploy backend to Azure/AWS
2. ✅ Deploy frontend to Vercel/Netlify
3. ✅ Integrate payment gateway (Razorpay/Stripe)
4. ✅ Add user authentication (Supabase)
5. ✅ Launch marketing campaign

---

*All three features are production-ready pending successful testing!*
