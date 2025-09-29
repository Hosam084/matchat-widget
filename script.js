let matchesData=[], selectedDay='today';
let showCount = 8;
let currentDisplay = showCount;

function fetchMatches(){
  const cached = localStorage.getItem('matchesCache');
  const cacheTime = localStorage.getItem('matchesCacheTime');
  const now = new Date().getTime();

  if(cached && cacheTime && now - cacheTime < 1000*60*5){ // كاش 5 دقائق
    matchesData = JSON.parse(cached);
    populateLeagues();
    renderMatches();
  }

  updateMatches(); // fetch مباشر عند التحميل
  setInterval(updateMatches, 30000); // تحديث مباشر كل 30 ثانية
}

function updateMatches(){
  const url='https://script.google.com/macros/s/AKfycbzLx-Y1Qc2C0FYapTfdYqSR0G3V3roRHiG6iVd8Ey3MFrGcXqDfo1HdJyvGxFJIzJqyAg/exec';
  fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url)+'?t=' + new Date().getTime())
  .then(r=>r.json())
  .then(data=>{
    if(JSON.stringify(data) !== JSON.stringify(matchesData)){
      matchesData = data;
      localStorage.setItem('matchesCache', JSON.stringify(data));
      localStorage.setItem('matchesCacheTime', new Date().getTime());
      populateLeagues();
      renderMatches();
    }
  })
  .catch(err=>console.error('فشل التحديث المباشر:', err));
}

function populateLeagues(){
  const leagueFilter=document.getElementById('leagueFilter');
  const leagues=[...new Set(matchesData.map(m=>m.League).filter(l=>l))];
  leagueFilter.innerHTML='<option value="all">كل الدوريات</option>';
  leagues.forEach(l=>{
    const opt=document.createElement('option'); opt.value=l; opt.textContent=l;
    leagueFilter.appendChild(opt);
  });
}

function filterMatches(){
  const today=new Date(); today.setHours(0,0,0,0);
  let filtered=matchesData.filter(m=>{
    const md=new Date(m.Date.replace(/-/g,'/')); md.setHours(0,0,0,0);
    const diff=Math.round((md-today)/(1000*60*60*24));
    if(selectedDay==='today') return diff===0;
    if(selectedDay==='yesterday') return diff===-1;
    if(selectedDay==='tomorrow') return diff===1;
    return false;
  });
  const leagueVal=document.getElementById('leagueFilter').value;
  if(leagueVal!=='all') filtered=filtered.filter(m=>m.League===leagueVal);
  return filtered;
}

function renderMatches(){
  const container=document.getElementById('matchesContainer');
  container.innerHTML='';
  const list=filterMatches();
  if(list.length===0){container.innerHTML='<p>لا توجد مباريات</p>'; return;}
  
  list.slice(0,currentDisplay).forEach(m=>{
    const card=document.createElement('div'); card.className='match-card';
    card.innerHTML=`<div>${m["Home Logo"]?`<img src="${m["Home Logo"]}" alt="${m["Home Team"]}">`:''} ${m["Home Team"]}</div>
                      <div>${m["Score Home"]||0} - ${m["Score Away"]||0}</div>
                      <div>${m["Away Logo"]?`<img src="${m["Away Logo"]}" alt="${m["Away Team"]}">`:''} ${m["Away Team"]}</div>`;
    container.appendChild(card);
  });

  const btn = document.getElementById('loadMoreBtn');
  if(list.length > currentDisplay){
    btn.style.display = 'inline-block';
    btn.textContent = 'عرض المزيد';
  } else if(currentDisplay > showCount){
    btn.style.display = 'inline-block';
    btn.textContent = 'عرض أقل';
  } else {
    btn.style.display = 'none';
  }
}

// أحداث الفلاتر
document.querySelectorAll('.date-filter button').forEach(b=>{
  b.addEventListener('click',e=>{
    document.querySelectorAll('.date-filter button').forEach(bt=>bt.classList.remove('active'));
    e.target.classList.add('active');
    selectedDay=e.target.dataset.day;
    currentDisplay = showCount;
    renderMatches();
  });
});
document.getElementById('leagueFilter').addEventListener('change', ()=>{
  currentDisplay = showCount;
  renderMatches();
});

document.getElementById('loadMoreBtn').addEventListener('click', ()=>{
  const list=filterMatches();
  if(currentDisplay < list.length){
    currentDisplay = list.length; // عرض الكل
  } else {
    currentDisplay = showCount; // عرض أول 8 فقط
  }
  renderMatches();
});

fetchMatches();
