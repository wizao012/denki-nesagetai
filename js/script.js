/* ---------- 設定 ---------- */
const CONFIG = {
  ZAPIER_WEBHOOK_URL: 'https://hooks.zapier.com/hooks/catch/12525485/4biygd0/',
  THANKS_PAGE: 'thanks.html',
  PARAM_KEYS: [
    'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
    'placement','keyword','matchtype','gclid','fbclid','lpv'
  ]
};

/* ---------- GTM dataLayer 初期化 ---------- */
window.dataLayer = window.dataLayer || [];

/* ---------- URLパラメータをhidden inputへ ---------- */
(function captureUrlParams(){
  try{
    const params = new URLSearchParams(location.search);
    CONFIG.PARAM_KEYS.forEach(function(key){
      const el = document.getElementById('trk-' + key);
      if (el) el.value = params.get(key) || '';
    });
    const lpPathEl = document.getElementById('trk-lp_path');
    if (lpPathEl) lpPathEl.value = location.pathname || '';
    const referrerEl = document.getElementById('trk-referrer');
    if (referrerEl) referrerEl.value = document.referrer || '';
  }catch(e){}
})();

/* ---------- ハンバーガードロワー ---------- */
(function(){
  const btn = document.getElementById('menuBtn');
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('drawerOverlay');
  const closeBtn = document.getElementById('drawerClose');
  if(!btn || !drawer) return;
  function open(){
    document.body.classList.add('drawer-open');
    drawer.setAttribute('aria-hidden','false');
    btn.setAttribute('aria-expanded','true');
  }
  function close(){
    document.body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden','true');
    btn.setAttribute('aria-expanded','false');
  }
  btn.addEventListener('click', open);
  if(closeBtn) closeBtn.addEventListener('click', close);
  if(overlay) overlay.addEventListener('click', close);
  drawer.querySelectorAll('[data-nav]').forEach(function(a){
    a.addEventListener('click', close);
  });
})();

/* ---------- 電話番号 正規化・バリデーション ---------- */
function normalizeTel(v){
  if(!v) return '';
  // 全角→半角
  v = v.replace(/[０-９]/g, function(c){ return String.fromCharCode(c.charCodeAt(0)-0xFEE0); });
  // 数字以外除去
  return v.replace(/[^0-9]/g, '');
}
function validateTel(digits){
  if(digits.length !== 10 && digits.length !== 11){
    return '電話番号はハイフンなしの10桁または11桁で入力してください。';
  }
  if(digits.length === 11 && !/^0[789]0/.test(digits)){
    return '携帯電話番号は090・080・070から始まる11桁で入力してください。';
  }
  // 明らかな不自然番号を弾く
  if(/^(\d)\1+$/.test(digits)) return '有効な電話番号を入力してください。'; // 全部同じ数字
  if('0123456789'.indexOf(digits) !== -1 || '9876543210'.indexOf(digits) !== -1){
    return '有効な電話番号を入力してください。'; // 連番
  }
  if(/^0[789]0(\d)\1{7}$/.test(digits)) return '有効な電話番号を入力してください。'; // 09000000000 等
  return '';
}

/* ---------- フォーム送信（Zapier送信 + GTMイベント） ---------- */
(function(){
  const form = document.getElementById('leadForm');
  if(!form) return;
  const submitBtn = document.getElementById('submitBtn');
  const btnBody = submitBtn ? submitBtn.querySelector('.body') : null;
  const defaultLabel = btnBody ? btnBody.innerHTML : '';
  const telEl = document.getElementById('f-tel');
  const telErr = document.getElementById('err-tel');

  // 入力時に正規化＋エラークリア
  if(telEl){
    telEl.addEventListener('blur', function(){
      telEl.value = normalizeTel(telEl.value);
    });
    telEl.addEventListener('input', function(){
      if(telErr) telErr.textContent = '';
      telEl.classList.remove('err');
    });
  }

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    // 必須バリデーション（電力会社=companyは任意）
    if(!form.checkValidity()){
      form.reportValidity();
      return;
    }
    // 電話番号バリデーション
    if(telEl){
      const digits = normalizeTel(telEl.value);
      telEl.value = digits;
      const msg = validateTel(digits);
      if(msg){
        if(telErr) telErr.textContent = msg;
        telEl.classList.add('err');
        telEl.focus();
        return;
      }
    }
    submitBtn.disabled = true;
    if(btnBody) btnBody.textContent = '送信中...';
    const formData = new FormData(form);
    formData.append('submitted_at', new Date().toISOString());
    formData.append('source_url', window.location.href);
    try{
      await fetch(CONFIG.ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
      window.dataLayer.push({ event: 'form_submit_cv' });
      window.location.href = CONFIG.THANKS_PAGE;
    }catch(err){
      submitBtn.disabled = false;
      if(btnBody) btnBody.innerHTML = defaultLabel;
      alert('送信に失敗しました。時間をおいて再度お試しください。');
    }
  });
})();

/* ===== Cases carousel dots ===== */
  (function(){
    const rail=document.querySelector('.case-grid3');
    const dots=document.querySelectorAll('#casesDots i');
    if(rail&&dots.length){
      rail.addEventListener('scroll',()=>{
        const i=Math.round(rail.scrollLeft/(rail.scrollWidth/dots.length));
        dots.forEach((d,n)=>d.classList.toggle('on',n===Math.min(i,dots.length-1)));
      },{passive:true});
    }
  })();

  /* ===== FAQ accordion ===== */
  document.querySelectorAll('.faq-item .faq-q').forEach(btn=>{
    btn.addEventListener('click',()=>{
      btn.parentElement.classList.toggle('open');
    });
  });

  /* ===== FV staged animation ===== */
  function startFv(){
    const stage = document.getElementById('fvStage');
    if (stage) stage.classList.add('on');
  }
  if (document.readyState === 'complete') startFv();
  else window.addEventListener('load', startFv);

  /* ===== Reveal on scroll ===== */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  },{threshold:0.12, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  /* ===== Fixed bottom CTA ===== */
  const bottomCta = document.getElementById('bottomCta');
  const fvEl = document.querySelector('.fv');
  const finalCtaEl = document.querySelector('.final-cta');
  function updateBottomCta(){
    const scrollY = window.scrollY || window.pageYOffset;
    const fvBottom = fvEl.offsetTop + fvEl.offsetHeight - 80;
    const finalTop = finalCtaEl.offsetTop - window.innerHeight + 120;
    const show = scrollY > fvBottom && scrollY < finalTop;
    bottomCta.classList.toggle('show', show);
    bottomCta.setAttribute('aria-hidden', show ? 'false' : 'true');
  }
  window.addEventListener('scroll', updateBottomCta, {passive:true});
  window.addEventListener('resize', updateBottomCta);
  updateBottomCta();