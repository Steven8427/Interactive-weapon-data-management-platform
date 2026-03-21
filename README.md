# 有力气的改枪网站 - Delta Force Gun Codes

三角洲行动改枪码大全 | 主播同款改枪码 · 官方热门改枪码 · 玩家社区 · 物价趋势 · 战术地图

**Live Site:** [guns.yufantechs.com](https://guns.yufantechs.com)

## Features

- **主播同款改枪码** - 36+ 位主播的改枪方案，一键复制改枪码
- **官方热门改枪码** - 自动同步腾讯 AMS 官方数据
- **玩家社区** - 玩家自建改枪方案，投票、评论、分享
- **每日口令** - 每日更新的游戏口令码
- **物价趋势** - 武器配件价格走势图表
- **制造概率** - 武器制造概率查询
- **物品图鉴** - 全物品数据库搜索
- **战术地图** - 互动式地图工具
- **配装推荐** - 武器配装方案

## Screenshots

<img width="1914" height="918" alt="主播同款改枪码" src="https://github.com/user-attachments/assets/5d7422f2-4d94-476a-9610-fdbb12ace83b" />
<img width="1916" height="920" alt="官方热门改枪码" src="https://github.com/user-attachments/assets/0d001364-d57d-466f-8075-c132a2471f9e" />
<img width="1919" height="938" alt="玩家社区" src="https://github.com/user-attachments/assets/60d6946d-bada-486f-81cd-0e4211de2fa1" />
<img width="1890" height="944" alt="物价趋势" src="https://github.com/user-attachments/assets/b70baf97-f4a3-406b-83b6-8c3c1fa19b67" />

## Tech Stack

- **Frontend:** React 18 + React Router 6
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Data Sync:** Supabase Edge Functions + Tencent AMS API
- **SEO:** react-helmet-async + JSON-LD structured data
- **Hosting:** Netlify
- **Notifications:** react-hot-toast

## Project Structure

```text
src/
  index.js                  # App entry with HelmetProvider
  supabaseClient.js         # Supabase client config
  components/
    SEO.jsx                 # Reusable SEO meta tags component
  pages/
    Landing.jsx             # Homepage
    Streamers.jsx           # Streamer gun codes
    OfficialCodes.jsx       # Official hot gun codes
    Community.jsx           # Player community
    DailyPassword.jsx       # Daily password codes
    PriceTrend.jsx          # Price trends
    Manufacturing.jsx       # Manufacturing probability
    ItemCatalog.jsx         # Item database
    MapTool.jsx             # Tactical map tool
    Loadout.jsx             # Loadout recommendations
    Legal.jsx               # Legal page
    Admin.jsx               # Admin dashboard
public/
  index.html                # HTML with JSON-LD structured data
  sitemap.xml               # Sitemap for SEO
  robots.txt
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment variables

Create a `.env` file in the project root:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start the development server

```bash
npm start
```

## Build & Deploy

```bash
npm run build
```

Deployed on Netlify with:
- Build command: `npm run build`
- Publish directory: `build`
- Environment variables configured in Netlify dashboard

## Admin Dashboard

Access at `/admin` - features include:
- Streamer management (add/edit/sort/hide streamers and codes)
- Daily password management
- Data sync controls
- Community moderation & code review
- Sensitive word filtering
- Admin user management
