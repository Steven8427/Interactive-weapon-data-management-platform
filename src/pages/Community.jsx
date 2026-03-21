import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';

const CATS = ["全部","突击步枪","战斗步枪","射手步枪","冲锋枪","机枪","狙击步枪","连狙","霰弹枪","手枪","弓弩"];
const CAT_ICON = {"突击步枪":"🔫","战斗步枪":"⚔️","射手步枪":"🎯","冲锋枪":"💨","机枪":"🔥","狙击步枪":"🔭","连狙":"🎯","霰弹枪":"💥","手枪":"🔫","弓弩":"🏹"};
const CAT_COLOR = {"突击步枪":"#30d060","战斗步枪":"#e0a030","射手步枪":"#50b0e0","冲锋枪":"#d050d0","机枪":"#e06030","狙击步枪":"#4090f0","连狙":"#60c0c0","霰弹枪":"#d04040","手枪":"#a0a0a0","弓弩":"#90d040"};

function Community() {
  const [player, setPlayer] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [playerGunStats, setPlayerGunStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  // Auth
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '', confirmPassword: '', nickname: '' });
  const [showPw, setShowPw] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Profile
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ nickname: '', description: '' });
  const [profileAvatar, setProfileAvatar] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Content filter
  const [bannedWords, setBannedWords] = useState([]);

  // Detail page
  const [guns, setGuns] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterCat, setFilterCat] = useState('全部');
  const [filterVer, setFilterVer] = useState('全部');
  const [detailSearch, setDetailSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');

  // Management (own profile)
  const [selectedGunId, setSelectedGunId] = useState('');
  const [variantForm, setVariantForm] = useState({ version: '', price: '', mod_type: '', code: '', effective_range: '' });
  const [editingVariant, setEditingVariant] = useState(null);
  const [gunSearch, setGunSearch] = useState('');
  const [catalogResults, setCatalogResults] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const catalogRef = useRef(null);

  // 点击外部关闭下拉
  useEffect(() => {
    if (!showCatalog) return;
    const handler = (e) => { if (catalogRef.current && !catalogRef.current.contains(e.target)) setShowCatalog(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCatalog]);

  // Load saved login
  useEffect(() => { const s = localStorage.getItem('df_player'); if (s) try { setPlayer(JSON.parse(s)); } catch {} }, []);
  useEffect(() => { supabase.from('banned_words').select('word').then(({ data }) => { if (data) setBannedWords(data.map(d => d.word.toLowerCase())); }); }, []);

  // Content filter: banned words + patterns (phone/email/URL)
  function checkContent(text) {
    if (!text) return null;
    const t = text.toLowerCase();
    // Check banned words
    for (const w of bannedWords) { if (t.includes(w)) return `包含违规内容「${w}」`; }
    // Check phone numbers
    if (/1[3-9]\d{9}/.test(text)) return '不允许包含手机号';
    // Check email
    if (/[\w.-]+@[\w.-]+\.\w+/.test(text)) return '不允许包含邮箱地址';
    // Check URLs
    if (/https?:\/\/|www\.|\.com|\.cn|\.net|\.org|\.top/i.test(text)) return '不允许包含网址链接';
    // Check QQ/WeChat patterns
    if (/[Qq]{2}\s*[:：]?\s*\d{5,}/.test(text) || /微信\s*[:：]?\s*\S{4,}/.test(text)) return '不允许包含联系方式';
    return null;
  }

  // Fetch player list with gun stats
  const fetchPlayerList = useCallback(async () => {
    setLoading(true);
    const { data: ps } = await supabase.from('players').select('*').order('created_at');
    setAllPlayers(ps || []);
    // Get gun counts per player
    const { data: gunData } = await supabase.from('guns').select('player_id, id');
    const { data: varData } = await supabase.from('gun_variants').select('gun_id');
    const gunsByPlayer = {};
    const variantsByGun = {};
    (gunData || []).forEach(g => { if (!g.player_id) return; if (!gunsByPlayer[g.player_id]) gunsByPlayer[g.player_id] = []; gunsByPlayer[g.player_id].push(g.id); });
    (varData || []).forEach(v => { variantsByGun[v.gun_id] = (variantsByGun[v.gun_id] || 0) + 1; });
    const stats = {};
    Object.entries(gunsByPlayer).forEach(([pid, gids]) => {
      stats[pid] = { gunCount: gids.length, variantCount: gids.reduce((s, gid) => s + (variantsByGun[gid] || 0), 0) };
    });
    setPlayerGunStats(stats);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlayerList(); }, [fetchPlayerList]);

  // Fetch guns for selected player
  const fetchPlayerGuns = useCallback(async (pid) => {
    setDetailLoading(true);
    const { data: g } = await supabase.from('guns').select('*').eq('player_id', pid).order('sort_order');
    const gunIds = (g || []).map(x => x.id);
    let v = [];
    if (gunIds.length > 0) {
      const { data } = await supabase.from('gun_variants').select('*').in('gun_id', gunIds).order('sort_order');
      v = data || [];
    }
    setGuns((g || []).map(gun => ({ ...gun, variants: v.filter(x => x.gun_id === gun.id) })));
    setDetailLoading(false);
  }, []);

  useEffect(() => { if (selectedPlayerId) fetchPlayerGuns(selectedPlayerId); }, [selectedPlayerId, fetchPlayerGuns]);

  // Auth handlers
  async function handleAuth(e) {
    e.preventDefault();
    if (authMode === 'register') {
      if (!agreeTerms) { toast.error('请先同意用户协议'); return; }
      if (!authForm.username.trim() || !authForm.password.trim()) { toast.error('用户名和密码必填'); return; }
      if (authForm.password.length < 6) { toast.error('密码至少6位'); return; }
      if (authForm.password !== authForm.confirmPassword) { toast.error('两次密码不一致'); return; }
      const nameCheck = checkContent(authForm.username.trim());
      if (nameCheck) { toast.error(`用户名${nameCheck}`); return; }
      if (authForm.nickname.trim()) {
        const nickCheck = checkContent(authForm.nickname.trim());
        if (nickCheck) { toast.error(`昵称${nickCheck}`); return; }
      }
      const { data: exists } = await supabase.from('players').select('id').eq('username', authForm.username.trim().toLowerCase()).single();
      if (exists) { toast.error('用户名已存在'); return; }
      const { data, error } = await supabase.from('players').insert({ username: authForm.username.trim().toLowerCase(), password_hash: authForm.password, nickname: authForm.nickname.trim() || authForm.username.trim() }).select().single();
      if (error) { toast.error('注册失败'); return; }
      setPlayer(data); localStorage.setItem('df_player', JSON.stringify(data)); toast.success('注册成功！'); setShowAuthModal(false); setAuthForm({ username: '', password: '', confirmPassword: '', nickname: '' }); setShowPw(false); setAgreeTerms(false); fetchPlayerList();
    } else {
      const { data, error } = await supabase.from('players').select('*').eq('username', authForm.username.trim().toLowerCase()).eq('password_hash', authForm.password).single();
      if (error || !data) { toast.error('用户名或密码错误'); return; }
      setPlayer(data); localStorage.setItem('df_player', JSON.stringify(data)); toast.success(`欢迎，${data.nickname || data.username}！`); setShowAuthModal(false); setAuthForm({ username: '', password: '', confirmPassword: '', nickname: '' }); setShowPw(false);
    }
  }
  function logout() { setPlayer(null); localStorage.removeItem('df_player'); toast.success('已退出'); }

  function openProfile() {
    if (!player) return;
    setProfileForm({ nickname: player.nickname || '', description: player.description || '' });
    setProfileAvatar(null);
    setShowProfile(true);
  }

  async function saveProfile() {
    if (!player) return;
    // Content check
    if (profileForm.nickname.trim()) {
      const nickCheck = checkContent(profileForm.nickname.trim());
      if (nickCheck) { toast.error(`昵称${nickCheck}`); return; }
    }
    if (profileForm.description.trim()) {
      const descCheck = checkContent(profileForm.description.trim());
      if (descCheck) { toast.error(`简介${descCheck}`); return; }
    }
    setProfileSaving(true);
    let avatarUrl = null;
    if (profileAvatar) {
      try {
        const ext = profileAvatar.name.split('.').pop();
        const fname = `avatar_${player.id}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('gun-images').upload(fname, profileAvatar);
        if (upErr) { toast.error('头像上传失败'); setProfileSaving(false); return; }
        const { data: urlData } = supabase.storage.from('gun-images').getPublicUrl(fname);
        avatarUrl = urlData.publicUrl;
      } catch { toast.error('上传失败'); setProfileSaving(false); return; }
    }
    // Save as pending review
    const updates = {
      pending_nickname: profileForm.nickname.trim() || player.username,
      pending_description: profileForm.description.trim(),
      pending_avatar_url: avatarUrl,
      profile_status: 'pending',
    };
    const { error } = await supabase.from('players').update(updates).eq('id', player.id);
    if (error) { toast.error('提交失败'); setProfileSaving(false); return; }
    toast.success('资料已提交，等待管理员审核'); setShowProfile(false); setProfileSaving(false);
  }

  // Gun catalog search (for adding guns)
  async function searchCatalog(q) {
    setGunSearch(q);
    if (q.length < 1) { setCatalogResults([]); setShowCatalog(false); return; }
    const { data } = await supabase.from('gun_catalog').select('*').ilike('object_name', `%${q}%`).eq('primary_class', 'gun').limit(10);
    setCatalogResults(data || []);
    setShowCatalog(true);
  }

  // Add gun from catalog - optimistic local update
  async function addGunFromCatalog(item) {
    if (!player) return;
    const catSuffixes = ['紧凑突击步枪','通用机枪','轻机枪','突击步枪','战斗步枪','射手步枪','狙击步枪','冲锋枪','霰弹枪','手枪'];
    const catMap = {'紧凑突击步枪':'突击步枪','通用机枪':'机枪','轻机枪':'机枪'};
    const CLASS_TO_CAT = { gunRifle:'突击步枪', gunSMG:'冲锋枪', gunShotgun:'霰弹枪', gunSniper:'狙击步枪', gunMP:'射手步枪', gunLMG:'机枪', gunPistol:'手枪' };
    let name = item.object_name;
    let cat = CLASS_TO_CAT[item.second_class] || item.second_class_cn || '突击步枪';
    for (const s of catSuffixes) {
      if (name.includes(s)) { cat = catMap[s] || s; name = name.replace(s, '').trim(); break; }
    }
    const existing = guns.find(g => g.name === name);
    if (existing) { toast.error('已有此枪械'); setShowCatalog(false); setGunSearch(''); return; }
    const mx = guns.reduce((m, g) => Math.max(m, g.sort_order || 0), 0);
    const { data: newGun } = await supabase.from('guns').insert({ name, category: cat, image_url: item.pic || '', player_id: player.id, sort_order: mx + 1 }).select().single();
    if (newGun) setGuns(prev => [...prev, { ...newGun, variants: [] }]);
    toast.success(`${name} 已添加！`);
    setShowCatalog(false); setGunSearch('');
  }

  // Delete gun - optimistic local update
  async function deleteGun(id, name) {
    if (!window.confirm(`删除 ${name}？其下所有改装码也会被删除！`)) return;
    await supabase.from('gun_variants').delete().eq('gun_id', id);
    await supabase.from('guns').delete().eq('id', id);
    setGuns(prev => prev.filter(g => g.id !== id));
    if (selectedGunId === id) setSelectedGunId('');
    toast.success('已删除');
  }

  // Add variant - optimistic local update
  async function addVariant() {
    if (!selectedGunId || !variantForm.code.trim()) { toast.error('请填写改枪码'); return; }
    const gun = guns.find(g => g.id === selectedGunId);
    const mx = gun ? gun.variants.reduce((m, v) => Math.max(m, v.sort_order || 0), 0) : 0;
    const { data: newV } = await supabase.from('gun_variants').insert({ gun_id: selectedGunId, ...variantForm, sort_order: mx + 1, status: 'pending' }).select().single();
    if (newV) setGuns(prev => prev.map(g => g.id === selectedGunId ? { ...g, variants: [...g.variants, newV] } : g));
    toast.success('已提交，等待管理员审核'); setVariantForm({ version: '', price: '', mod_type: '', code: '', effective_range: '' });
  }

  // Delete variant - optimistic local update
  async function deleteVariant(id) {
    if (!window.confirm('确定删除？')) return;
    await supabase.from('gun_variants').delete().eq('id', id);
    setGuns(prev => prev.map(g => ({ ...g, variants: g.variants.filter(v => v.id !== id) })));
    toast.success('已删除');
  }

  // Update variant - optimistic local update
  async function updateVariant() {
    if (!editingVariant) return;
    const updates = { version: editingVariant.version, price: editingVariant.price, mod_type: editingVariant.mod_type, code: editingVariant.code, effective_range: editingVariant.effective_range };
    await supabase.from('gun_variants').update(updates).eq('id', editingVariant.id);
    setGuns(prev => prev.map(g => ({ ...g, variants: g.variants.map(v => v.id === editingVariant.id ? { ...v, ...updates } : v) })));
    toast.success('更新成功！'); setEditingVariant(null);
  }

  function copyCode(code) { navigator.clipboard.writeText(code).then(() => toast.success('改枪码已复制！')).catch(() => { const ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast.success('改枪码已复制！'); }); }
  function getVersionClass(v) { if (!v) return 'version-t0'; if (v.includes('T0')) return 'version-t0'; if (v.includes('T1')) return 'version-t1'; if (v.includes('T2')) return 'version-t2'; return 'version-t0'; }
  function hasField(variants, field) { return variants.some(v => v[field] && v[field].toString().trim() !== ''); }

  // Filter guns for display
  const versions = useMemo(() => { const s = new Set(); guns.forEach(g => g.variants.forEach(v => { if (v.version) s.add(v.version); })); return ['全部', ...Array.from(s).sort()]; }, [guns]);

  const isOwnProfile = selectedPlayerId === player?.id;

  const filtered = useMemo(() => {
    let r = guns.map(g => ({
      ...g,
      variants: isOwnProfile ? g.variants : g.variants.filter(v => v.status === 'approved' || !v.status)
    }));
    if (filterCat !== '全部') r = r.filter(g => g.category === filterCat);
    if (filterVer !== '全部') r = r.filter(g => g.variants.some(v => v.version === filterVer));
    if (detailSearch.trim()) { const s = detailSearch.toLowerCase(); r = r.filter(g => g.name.toLowerCase().includes(s) || g.category?.toLowerCase().includes(s) || g.variants.some(v => (v.mod_type || '').toLowerCase().includes(s))); }
    if (filterVer !== '全部') r = r.map(g => ({ ...g, variants: g.variants.filter(v => v.version === filterVer) }));
    if (sortBy === 'price_asc') r = [...r].sort((a, b) => Math.min(...a.variants.map(v => parseFloat(v.price) || 999)) - Math.min(...b.variants.map(v => parseFloat(v.price) || 999)));
    if (sortBy === 'price_desc') r = [...r].sort((a, b) => Math.max(...b.variants.map(v => parseFloat(v.price) || 0)) - Math.max(...a.variants.map(v => parseFloat(v.price) || 0)));
    // Remove guns with no visible variants
    r = r.filter(g => g.variants.length > 0);
    return r;
  }, [guns, filterCat, filterVer, detailSearch, sortBy, isOwnProfile]);

  // Player cards for main page
  const playerCards = useMemo(() => {
    let list = allPlayers.filter(p => {
      const s = playerGunStats[p.id];
      return s && (s.gunCount > 0 || s.variantCount > 0);
    });
    // Own first
    if (player?.id) list.sort((a, b) => (a.id === player.id ? -1 : b.id === player.id ? 1 : 0) || (playerGunStats[b.id]?.variantCount || 0) - (playerGunStats[a.id]?.variantCount || 0));
    // Search
    if (search.trim()) { const s = search.toLowerCase(); list = list.filter(p => (p.nickname || p.username || '').toLowerCase().includes(s)); }
    // Always show self even if 0 guns
    if (player?.id && !list.find(p => p.id === player.id)) {
      const me = allPlayers.find(p => p.id === player.id);
      if (me) list.unshift(me);
    }
    return list;
  }, [allPlayers, playerGunStats, player, search]);

  const selectedPlayer = selectedPlayerId ? allPlayers.find(p => p.id === selectedPlayerId) : null;
  const selectedGun = guns.find(g => g.id === selectedGunId);

  if (loading) return <div className="loading"><div className="spinner"></div>加载社区数据...</div>;

  // =====================================================================
  // 玩家详情页
  // =====================================================================
  if (selectedPlayerId && selectedPlayer) {
    const totalVariants = guns.reduce((s, g) => s + g.variants.length, 0);

    if (detailLoading) return <div className="loading"><div className="spinner"></div>加载枪械数据中...</div>;

    return (
      <div>
        <button onClick={() => { setSelectedPlayerId(null); setSelectedGunId(''); setFilterCat('全部'); setFilterVer('全部'); setDetailSearch(''); setSortBy('default'); fetchPlayerList(); }}
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 16, display: 'block' }}>← 返回社区</button>

        {/* 作者信息头 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          {selectedPlayer.avatar_url ? (
            <img src={selectedPlayer.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(30,204,96,0.12)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {(selectedPlayer.nickname || selectedPlayer.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="page-title" style={{ fontSize: 22, marginBottom: 2 }}>{selectedPlayer.nickname || selectedPlayer.username} 的改枪码</h1>
          </div>
        </div>
        <p className="page-subtitle">点击改枪码即可复制 · {guns.length} 把武器 · {totalVariants} 个配置</p>

        {/* ===== 自己的页面：管理面板 ===== */}
        {isOwnProfile && (
          <div className="admin-section" style={{ marginBottom: 16 }}>
            <h3>✏️ 添加枪械与改枪码</h3>
            {/* 搜索添加枪械 */}
            <div ref={catalogRef} style={{ position: 'relative', marginBottom: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>搜索枪械（从官方目录添加）</label>
                <input type="text" value={gunSearch} onChange={e => searchCatalog(e.target.value)} placeholder="输入枪名，如 AKM、M4A1..."
                  onFocus={() => { if (catalogResults.length) setShowCatalog(true); }} />
              </div>
              {showCatalog && catalogResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 8, maxHeight: 240, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  {catalogResults.map(item => (
                    <div key={item.object_id} onClick={() => addGunFromCatalog(item)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(32,232,112,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {item.pic && <img src={item.pic} alt="" style={{ width: 36, height: 26, objectFit: 'contain', borderRadius: 4, background: 'linear-gradient(135deg,#1a2a3a,#1e3040)' }} />}
                      <div><div style={{ fontSize: 14, fontWeight: 600 }}>{item.object_name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.second_class_cn}</div></div>
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)' }}>+ 添加</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 选择枪械添加改装码 */}
            {guns.length > 0 && (<>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label>选择枪械添加改枪码</label>
                <select value={selectedGunId} onChange={e => setSelectedGunId(e.target.value)} style={{ width: '100%' }}>
                  <option value="">-- 选择枪械 --</option>
                  {guns.map(g => <option key={g.id} value={g.id}>{g.name} ({g.variants.length}个配置)</option>)}
                </select>
              </div>

              {selectedGun && (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    {selectedGun.image_url && <img src={selectedGun.image_url} alt="" style={{ width: 40, height: 30, objectFit: 'contain', borderRadius: 5, background: 'linear-gradient(135deg,#1a2a3a,#1e3040)' }} />}
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>{selectedGun.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedGun.category}</span>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>段位</label><select value={variantForm.version} onChange={e => setVariantForm({ ...variantForm, version: e.target.value })}><option value="">不选</option>{['T0','T1','T2','T3','T4','狙击','连狙','手枪','弓弩'].map(t => <option key={t}>{t}</option>)}</select></div>
                    <div className="form-group"><label>价格</label><input type="text" value={variantForm.price} onChange={e => setVariantForm({ ...variantForm, price: e.target.value })} placeholder="85w" /></div>
                    <div className="form-group"><label>类型</label><input type="text" value={variantForm.mod_type} onChange={e => setVariantForm({ ...variantForm, mod_type: e.target.value })} placeholder="满改" /></div>
                    <div className="form-group"><label>射程</label><input type="text" value={variantForm.effective_range} onChange={e => setVariantForm({ ...variantForm, effective_range: e.target.value })} placeholder="52米" /></div>
                  </div>
                  <div className="form-group"><label>改枪码 *</label><input type="text" value={variantForm.code} onChange={e => setVariantForm({ ...variantForm, code: e.target.value })} placeholder="粘贴改枪码" style={{ fontFamily: 'monospace' }} /></div>
                  <button className="btn btn-primary" onClick={addVariant}>添加改枪码</button>
                </div>
              )}
            </>)}
          </div>
        )}

        {/* 分类筛选 */}
        <div className="filter-bar">
          {CATS.map(c => <button key={c} className={`filter-chip ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>{c !== '全部' && (CAT_ICON[c] || '') + ' '}{c}</button>)}
        </div>

        {/* 搜索+段位+排序 */}
        <div className="search-row">
          <div className="search-bar"><span className="search-icon">🔍</span><input placeholder="搜索枪械名称、改装类型..." value={detailSearch} onChange={e => setDetailSearch(e.target.value)} /></div>
          <select className="filter-select" value={filterVer} onChange={e => setFilterVer(e.target.value)}>{versions.map(v => <option key={v} value={v}>{v === '全部' ? '全部段位' : v}</option>)}</select>
          <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="default">默认排序</option><option value="price_asc">价格 低→高</option><option value="price_desc">价格 高→低</option></select>
        </div>

        {/* 枪械卡片列表（完全和 Home.jsx 一样） */}
        {filtered.length === 0 ? (
          <div className="loading" style={{ color: 'var(--text-muted)' }}>{guns.length === 0 ? '还没有枪械，使用上方搜索框添加' : '没有找到匹配的枪械'}</div>
        ) : (
          filtered.map(gun => {
            const catC = CAT_COLOR[gun.category] || '#1ecc60';
            const showVersion = hasField(gun.variants, 'version');
            const showPrice = hasField(gun.variants, 'price');
            const showModType = hasField(gun.variants, 'mod_type');
            const showRange = hasField(gun.variants, 'effective_range');

            return (
              <div key={gun.id} className="gun-card">
                <div className="gun-card-header" style={{ background: `linear-gradient(135deg, ${catC}08 0%, transparent 50%)` }}>
                  {gun.image_url ? <img src={gun.image_url} alt={gun.name} className="gun-header-img" /> : <div className="gun-icon">{CAT_ICON[gun.category] || '🔫'}</div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <span className="gun-name">{gun.name}</span>
                      <span className="cat-badge" style={{ background: `${catC}18`, color: catC, border: `1px solid ${catC}33` }}>{CAT_ICON[gun.category] || ''} {gun.category}</span>
                    </div>
                    <div className="gun-count">{gun.variants.length} 个配置方案</div>
                  </div>
                  {isOwnProfile && <button className="btn btn-danger btn-small" onClick={() => deleteGun(gun.id, gun.name)}>删除枪械</button>}
                </div>
                <div className="table-scroll">
                  <table className="variants-table" style={{ minWidth: 'auto' }}>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        {showVersion && <th style={{ width: 60 }}>段位</th>}
                        {showPrice && <th style={{ width: 70 }}>价格</th>}
                        {showModType && <th style={{ width: 110 }}>改装类型</th>}
                        <th>改枪码</th>
                        {showRange && <th style={{ width: 85 }}>有效射程</th>}
                        {isOwnProfile && <th style={{ width: 80 }}>操作</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {gun.variants.map((v, idx) => (
                        <tr key={v.id}>
                          {editingVariant?.id === v.id ? (<>
                            <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                            {showVersion && <td><select value={editingVariant.version} onChange={e => setEditingVariant({ ...editingVariant, version: e.target.value })} style={{ width: 55, padding: 3, background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }}>{['T0','T1','T2','T3','T4'].map(t => <option key={t}>{t}</option>)}</select></td>}
                            {showPrice && <td><input value={editingVariant.price} onChange={e => setEditingVariant({ ...editingVariant, price: e.target.value })} style={{ width: 50, padding: 3, background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }} /></td>}
                            {showModType && <td><input value={editingVariant.mod_type} onChange={e => setEditingVariant({ ...editingVariant, mod_type: e.target.value })} style={{ width: 80, padding: 3, background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }} /></td>}
                            <td><input value={editingVariant.code} onChange={e => setEditingVariant({ ...editingVariant, code: e.target.value })} style={{ width: '100%', padding: 3, background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'monospace', fontSize: 10 }} /></td>
                            {showRange && <td><input value={editingVariant.effective_range} onChange={e => setEditingVariant({ ...editingVariant, effective_range: e.target.value })} style={{ width: 50, padding: 3, background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }} /></td>}
                            <td><div style={{ display: 'flex', gap: 3 }}><button className="btn btn-success btn-small" onClick={updateVariant}>存</button><button className="btn btn-small" onClick={() => setEditingVariant(null)} style={{ color: 'var(--text-muted)' }}>消</button></div></td>
                          </>) : (<>
                            <td style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => copyCode(v.code)}>{idx + 1}</td>
                            {showVersion && <td onClick={() => copyCode(v.code)} style={{ cursor: 'pointer' }}>{v.version && <span className={`version-badge ${getVersionClass(v.version)}`}>{v.version}</span>}</td>}
                            {showPrice && <td style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => copyCode(v.code)}>{v.price || '-'}</td>}
                            {showModType && <td style={{ cursor: 'pointer' }} onClick={() => copyCode(v.code)}>{v.mod_type || '-'}</td>}
                            <td className="code-cell" onClick={() => copyCode(v.code)} style={{ cursor: 'pointer' }}>
                              {v.code}
                              {v.status === 'pending' && <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(224,160,48,0.15)', color: '#e0a030', fontWeight: 600 }}>待审核</span>}
                            </td>
                            {showRange && <td onClick={() => copyCode(v.code)} style={{ cursor: 'pointer' }}>{v.effective_range ? <span className="range-badge">{v.effective_range}</span> : '-'}</td>}
                            {isOwnProfile && <td><div style={{ display: 'flex', gap: 3 }}><button className="btn btn-success btn-small" onClick={() => setEditingVariant({ ...v })}>编</button><button className="btn btn-danger btn-small" onClick={() => deleteVariant(v.id)}>删</button></div></td>}
                          </>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // =====================================================================
  // 社区主页：玩家卡片
  // =====================================================================
  return (
    <div>
      <SEO title="玩家社区" path="/community" description="三角洲行动玩家改枪码分享社区，注册分享你的武器配置方案，交流改枪心得。" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h1 className="page-title">🌐 玩家社区</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {player ? (<>
            <div onClick={openProfile} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 10px', borderRadius: 20, background: 'rgba(32,232,112,0.06)', border: '1px solid rgba(32,232,112,0.15)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(32,232,112,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(32,232,112,0.15)'; }}>
              {player.avatar_url ? <img src={player.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(32,232,112,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{(player.nickname || player.username || '?').charAt(0).toUpperCase()}</div>}
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{player.nickname || player.username}</span>
            </div>
            <button onClick={logout} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>退出</button>
          </>) : (<>
            <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>登录</button>
            <button onClick={() => { setAuthMode('register'); setShowAuthModal(true); }} style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>注册</button>
          </>)}
        </div>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>分享和发现玩家的改枪方案 · 点击作者查看改枪码</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: '1 1 200px' }}><span className="search-icon">🔍</span><input placeholder="搜索玩家..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        {player && <button className="btn btn-primary" onClick={() => setSelectedPlayerId(player.id)}>✏️ 我的改枪码</button>}
      </div>

      {playerCards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 50, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌐</div>
          <p style={{ fontSize: 16, marginBottom: 8 }}>还没有人分享改枪码</p>
          <p style={{ fontSize: 13 }}>{player ? '点击上方按钮开始添加！' : '登录后即可创建改枪方案'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {playerCards.map(p => {
            const isMe = p.id === player?.id;
            const st = playerGunStats[p.id] || { gunCount: 0, variantCount: 0 };
            return (
              <div key={p.id} className="author-card" onClick={() => setSelectedPlayerId(p.id)}
                style={isMe ? { borderColor: 'rgba(32,232,112,0.3)', background: 'rgba(32,232,112,0.02)' } : {}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: isMe ? 'rgba(32,232,112,0.15)' : 'rgba(32,232,112,0.08)', border: `2px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {(p.nickname || p.username || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{p.nickname || p.username}</span>
                      {isMe && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(32,232,112,0.12)', color: '#20e870', fontWeight: 600 }}>我</span>}
                    </div>
                    {p.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.description}</div>}
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>→</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span className="author-stat">🔫 {st.gunCount} 把武器</span>
                  <span className="author-stat">📋 {st.variantCount} 个配置</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 登录弹窗 */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 380, width: '100%', position: 'relative' }}>
            <button onClick={() => { setShowAuthModal(false); setShowPw(false); }} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              <button className={`filter-chip ${authMode === 'login' ? 'active' : ''}`} onClick={() => { setAuthMode('login'); setShowPw(false); }}>登录</button>
              <button className={`filter-chip ${authMode === 'register' ? 'active' : ''}`} onClick={() => { setAuthMode('register'); setShowPw(false); }}>注册</button>
            </div>
            <form onSubmit={handleAuth}>
              <div className="form-group"><label>用户名</label><input type="text" value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })} placeholder="用户名" autoComplete="username" /></div>
              <div className="form-group">
                <label>密码{authMode === 'register' ? '（至少6位）' : ''}</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="密码" style={{ paddingRight: 40 }} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: showPw ? 'var(--accent)' : 'var(--text-muted)', padding: 4 }}>{showPw ? '👁️' : '👁️‍🗨️'}</button>
                </div>
              </div>
              {authMode === 'register' && (
                <div className="form-group">
                  <label>确认密码</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} value={authForm.confirmPassword} onChange={e => setAuthForm({ ...authForm, confirmPassword: e.target.value })} placeholder="再次输入密码" style={{ paddingRight: 40 }} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: showPw ? 'var(--accent)' : 'var(--text-muted)', padding: 4 }}>{showPw ? '👁️' : '👁️‍🗨️'}</button>
                  </div>
                  {authForm.password && authForm.confirmPassword && authForm.password !== authForm.confirmPassword && (
                    <div style={{ fontSize: 11, color: '#e04848', marginTop: 4 }}>两次密码不一致</div>
                  )}
                  {authForm.password && authForm.confirmPassword && authForm.password === authForm.confirmPassword && (
                    <div style={{ fontSize: 11, color: '#20e870', marginTop: 4 }}>✓ 密码一致</div>
                  )}
                </div>
              )}
              {authMode === 'register' && <div className="form-group"><label>昵称（选填）</label><input type="text" value={authForm.nickname} onChange={e => setAuthForm({ ...authForm, nickname: e.target.value })} placeholder="昵称" /></div>}
              {authMode === 'register' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
                    <span>我已阅读并同意 <a href="/legal?tab=terms" target="_blank" rel="noopener" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>《用户协议》</a> 和 <a href="/legal?tab=privacy" target="_blank" rel="noopener" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>《隐私政策》</a></span>
                  </label>
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4, opacity: authMode === 'register' && !agreeTerms ? 0.5 : 1 }}>{authMode === 'register' ? '注册' : '登录'}</button>
            </form>
          </div>
        </div>
      )}

      {/* 个人资料弹窗 */}
      {showProfile && player && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 420, width: '100%', position: 'relative' }}>
            <button onClick={() => setShowProfile(false)} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>

            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>👤 个人资料</h3>

            {player.profile_status === 'pending' && (
              <div style={{ padding: '8px 12px', marginBottom: 14, borderRadius: 8, background: 'rgba(224,160,48,0.1)', border: '1px solid rgba(224,160,48,0.25)', fontSize: 12, color: '#e0a030' }}>
                ⏳ 你有一份资料修改正在审核中，审核通过后自动生效
              </div>
            )}

            {/* 头像 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                {(profileAvatar ? URL.createObjectURL(profileAvatar) : player.avatar_url) ? (
                  <img src={profileAvatar ? URL.createObjectURL(profileAvatar) : player.avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(32,232,112,0.12)', border: '3px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 }}>
                    {(player.nickname || player.username || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <label style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, color: '#060d14', fontWeight: 700, border: '2px solid var(--bg-card)' }}>
                  📷
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setProfileAvatar(e.target.files[0]); }} />
                </label>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>@{player.username}</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{player.nickname || player.username}</div>
                {player.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{player.description}</div>}
              </div>
            </div>

            {/* 表单 */}
            <div className="form-group">
              <label>昵称</label>
              <input type="text" value={profileForm.nickname} onChange={e => setProfileForm({ ...profileForm, nickname: e.target.value })} placeholder="显示名称" />
            </div>
            <div className="form-group">
              <label>个人简介</label>
              <input type="text" value={profileForm.description} onChange={e => setProfileForm({ ...profileForm, description: e.target.value })} placeholder="一句话介绍自己" />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={saveProfile} disabled={profileSaving} style={{ flex: 1, justifyContent: 'center' }}>
                {profileSaving ? '保存中...' : '💾 保存'}
              </button>
              <button className="btn" onClick={() => setShowProfile(false)} style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Community;