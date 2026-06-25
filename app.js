/* ============================== STATE ============================== */
function chord(id,token,color,qualityOverride,notes){return {id,token,color:color||null,qualityOverride:qualityOverride||null,notes:notes||''};}
function section(id,name,color,chords){return {id,name,color:color||'blue',chords};}
function song(id,title,key,feel,category,sections,arrangement,tags){return {id,title,key,feel,category,tags:tags||[],sections,arrangement:arrangement||sections.map(s=>s.id),notes:'',createdAt:Date.now(),updatedAt:Date.now(),isBuiltIn:true};}

const baseSongs = [
  song('day','This Is The Day','F','bright praise','Kids / Congregational',[
    section('s1','Verse',  'green', [chord('c1','1','green'), chord('c2','4','blue'), chord('c3','1/5','green'), chord('c4','5sus','red')]),
    section('s2','Chorus', 'green', [chord('c1b','1','green'), chord('c2b','4','blue'), chord('c3b','1/5','green'), chord('c4b','5sus','red')]),
    section('s3','Ending','red',   [chord('c5','1','green'), chord('c6','4','blue'), chord('c7','#4dim','purple'), chord('c8','5dom','orange')])
  ], ['s1','s2','s2','s3'], ['praise','kids']),
  song('army','I\u2019m In The Lord\u2019s Army','G','march praise','Kids / Praise',[
    section('a1','Verse','green',[chord('a1c1','1','green'),chord('a1c2','4','blue'),chord('a1c3','1/5','green'),chord('a1c4','5dom','orange')]),
    section('a2','Chorus','blue',[chord('a2c1','1','green'),chord('a2c2','4','blue'),chord('a2c3','5dom','orange'),chord('a2c4','1','green')])
  ], ['a1','a2','a1','a2'], ['praise','kids','march']),
  song('run','Gospel Run Practice','Eb','practice etude','Practice',[
    section('r1','Run A','purple',[chord('r1c1','1','green'),chord('r1c2','6m','blue'),chord('r1c3','2m','blue'),chord('r1c4','5dom','orange')]),
    section('r2','Run B','purple',[chord('r2c1','4','blue'),chord('r2c2','#4dim','purple'),chord('r2c3','1/5','green'),chord('r2c4','5sus','red')])
  ], ['r1','r2'], ['practice','gospel']),
  song('preacher','Preacher Talk Bed','Eb','talk bed','Preacher / Organ',[
    section('p1','Talk Bed','purple',[chord('p1c1','1','green',null,'Hold here while preacher talks.'),chord('p1c2','4m13','blue'),chord('p1c3','3dom','red'),chord('p1c4','6m11','purple')])
  ], ['p1','p1'], ['preacher','organ']),
  song('shoutbasic','Shout Basic','Ab','praise break','Shout',[
    section('sh1','Shout','orange',[chord('sh1c1','1','green'),chord('sh1c2','4','blue'),chord('sh1c3','1/5','green'),chord('sh1c4','5dom','orange')])
  ], ['sh1'], ['shout'])
];

let state = loadState() || {
  theme:'dark', tab:'songs', songsSubTab:'songs', view:'both',
  songId:'day', selectedChordId:'c1', selectedSectionId:'s1',
  showExplanation:true,
  liveSource:'song', livePlaylistId:null, livePlaylistIndex:0, liveIndex:0, liveKeyOverride:null, liveLocked:false,
  songs: baseSongs,
  playlists: [
    {id:'pl1', title:'Sunday AM', items:[{id:'pi1',songId:'day',keyOverride:null},{id:'pi2',songId:'army',keyOverride:null}], createdAt:Date.now(), updatedAt:Date.now()}
  ],
  licks: [],
  paths: [],
  organPresets: [
    {id:'op1', title:'Preacher Talk', upper:'888000000', lower:'008800000', percussion:'Off', chorus:'C3', leslie:'Slow', expression:'40-60%', use:'Soft talking bed.'},
    {id:'op2', title:'Altar Swell', upper:'888400000', lower:'004400000', percussion:'Off', chorus:'C3', leslie:'Slow then fast', expression:'30-70%', use:'Swell into a moment.'},
    {id:'op3', title:'Shout Lead', upper:'888888000', lower:'808000000', percussion:'On', chorus:'V1', leslie:'Fast', expression:'70-100%', use:'Drive the praise break.'},
    {id:'op4', title:'Warm Worship', upper:'808400000', lower:'006600000', percussion:'Off', chorus:'C2', leslie:'Slow', expression:'40-60%', use:'Soft worship pad.'},
    {id:'op5', title:'Old School Church', upper:'888640000', lower:'808400000', percussion:'On', chorus:'V2', leslie:'Slow then fast', expression:'50-90%', use:'Classic church drive.'}
  ],
  pathForm:{key:'F',from:1,to:4,style:'Gospel',intensity:'Churchy',custom:''},
  chordLabForm:{key:'F',root:'1',level:'Churchy',style:'Gospel'},
  lickForm:{key:'F',from:'1',to:'5',style:'Gospel',speed:'Medium',difficulty:'Churchy'},
  pathResults:null, chordLabSelected:null, lickResult:null, whereNext:null, whereNextRoute:null,
  sheet:null
};
function saveState(){try{localStorage.setItem('gospel-path-v3-1', JSON.stringify(state));}catch(e){}}
function loadState(){try{return JSON.parse(localStorage.getItem('gospel-path-v3-1'))}catch(e){return null}}

/* ============================== HELPERS ============================== */
function currentSong(){return state.songs.find(s=>s.id===state.songId)||state.songs[0];}
function orderedSections(s){return s.arrangement.map(id=>s.sections.find(x=>x.id===id)).filter(Boolean);}
function allChordsOrdered(s){
  let out=[];
  orderedSections(s).forEach(sec=>{sec.chords.forEach(c=>out.push({...c, sectionId:sec.id, sectionName:sec.name, color:c.color||sec.color}));});
  return out;
}
function findChordRaw(id){for(const s of state.songs){for(const sec of s.sections){const c=sec.chords.find(x=>x.id===id); if(c) return {chord:c, song:s, section:sec};}}return null;}
function selectedChordRealized(){
  const s=currentSong();
  const found = allChordsOrdered(s).find(c=>c.id===state.selectedChordId) || allChordsOrdered(s)[0];
  if(!found) return null;
  const r = realizeChord(found.token, found.qualityOverride, s.key);
  return Object.assign({}, found, r);
}
function selectChord(id){state.selectedChordId=id; saveState(); render(); showPeek();}
function setTab(id){state.tab=id; state.sheet=null; saveState(); render();}
function setSongsSubTab(id){state.songsSubTab=id; saveState(); render();}
function toggleTheme(){document.documentElement.dataset.theme = document.documentElement.dataset.theme==='dark'?'light':'dark'; state.theme=document.documentElement.dataset.theme; saveState();}
function setView(v){state.view=v; saveState(); render();}
function toast(msg){const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1700);}

function displayChordText(realized){
  if(state.view==='numbers') return realized.numberDisplay;
  if(state.view==='chords') return realized.symbol;
  return realized.symbol+' / '+realized.numberDisplay;
}

/* ============================== RENDER SHELL ============================== */
const TABS = [
  {id:'songs', label:'Songs'}, {id:'path', label:'Path'}, {id:'chord', label:'Chord Lab'},
  {id:'licks', label:'Licks'}, {id:'shout', label:'Shout'}, {id:'organ', label:'Organ'}, {id:'live', label:'Live'}
];
const MOBILE_TABS = ['songs','path','chord','licks','live','more'];

function renderTabs(){
  document.getElementById('topTabs').innerHTML = TABS.map(t=>'<button class="tab '+(state.tab===t.id?'active':'')+'" onclick="setTab(\''+t.id+'\')">'+t.label+'</button>').join('');
  document.getElementById('bottomNav').innerHTML = MOBILE_TABS.map(function(id){
    if(id==='more') return '<button class="'+((state.tab==='shout'||state.tab==='organ')?'active':'')+'" onclick="openMoreSheet()">More</button>';
    const t=TABS.find(x=>x.id===id);
    return '<button class="'+(state.tab===id?'active':'')+'" onclick="setTab(\''+id+'\')">'+t.label+'</button>';
  }).join('');
}
function render(){
  renderTabs();
  closePeek();
  const page = document.getElementById('page');
  if(state.tab==='songs') page.innerHTML = renderSongsPage();
  else if(state.tab==='path') page.innerHTML = renderPathPage();
  else if(state.tab==='chord') page.innerHTML = renderChordLabPage();
  else if(state.tab==='licks') page.innerHTML = renderLicksPage();
  else if(state.tab==='shout') page.innerHTML = renderShoutPage();
  else if(state.tab==='organ') page.innerHTML = renderOrganPage();
  else if(state.tab==='live') page.innerHTML = renderLivePage();
  document.documentElement.dataset.theme = state.theme||'dark';
}

function viewToggleHTML(){
  return '<div class="seg">'+
    '<button class="'+(state.view==='numbers'?'active':'')+'" onclick="setView(\'numbers\')">Numbers</button>'+
    '<button class="'+(state.view==='chords'?'active':'')+'" onclick="setView(\'chords\')">Chords</button>'+
    '<button class="'+(state.view==='both'?'active':'')+'" onclick="setView(\'both\')">Both</button>'+
  '</div>';
}
function keySelectHTML(value, onchange){
  return '<select onchange="'+onchange+'">'+ALL_KEYS.map(k=>'<option '+(k===value?'selected':'')+'>'+k+'</option>').join('')+'</select>';
}

/* ============================== SONGS PAGE ============================== */
function renderSongsPage(){
  if(state.songsSubTab==='playlists') return renderPlaylistsPage();
  const s = currentSong();
  return '<div class="three-col">'+
    '<aside class="panel">'+
      '<div class="panel-head"><h2 class="label">Library</h2><span class="pill">'+state.songs.length+' songs</span></div>'+
      '<div class="panel-body">'+
        '<div class="subtabs">'+
          '<button class="subtab '+(state.songsSubTab==='songs'?'active':'')+'" onclick="setSongsSubTab(\'songs\')">Songs</button>'+
          '<button class="subtab '+(state.songsSubTab==='playlists'?'active':'')+'" onclick="setSongsSubTab(\'playlists\')">Playlists</button>'+
        '</div>'+
        '<div class="song-list">'+
          state.songs.map(function(sg){return '<button class="song-card '+(sg.id===state.songId?'active':'')+'" onclick="openSong(\''+sg.id+'\')">'+
            '<strong>'+sg.title+'</strong><span>Key '+sg.key+' \u00b7 '+sg.feel+'</span><span>'+sg.tags.join(', ')+'</span>'+
            '<div class="cardbtns"><button class="btn sm" onclick="event.stopPropagation();openSong(\''+sg.id+'\')">Open</button><button class="btn sm blue" onclick="event.stopPropagation();addToPlaylistPrompt(\''+sg.id+'\')">Add to Playlist</button></div>'+
          '</button>';}).join('')+
          '<button class="btn primary" onclick="addSong()">+ New Song</button>'+
        '</div>'+
      '</div>'+
    '</aside>'+
    '<section class="panel chart-card">'+renderSongDetail(s)+'</section>'+
    '<aside class="panel desktop-inspector">'+renderInspector()+'</aside>'+
  '</div>';
}
function renderSongDetail(s){
  const sections = orderedSections(s);
  const flat = allChordsOrdered(s);
  return ''+
    '<div class="spread">'+
      '<div><h1 class="chart-title">'+s.title+'</h1>'+
        '<div class="row" style="margin-top:8px">'+
          '<span class="pill">Key '+keySelectHTML(s.key,"changeSongKey(this.value)")+'</span>'+
          '<span class="pill">'+s.feel+'</span>'+
          viewToggleHTML()+
        '</div>'+
      '</div>'+
      '<div class="row">'+
        '<button class="btn green" onclick="sendSongToLive(\''+s.id+'\')">Live</button>'+
        '<button class="btn" onclick="duplicateSong()">Duplicate</button>'+
      '</div>'+
    '</div>'+

    '<div class="song-header-block">'+
      '<h4>Song Order</h4>'+
      '<div class="order-strip">'+s.arrangement.map(function(secId,i){const sec=s.sections.find(x=>x.id===secId); if(!sec) return ''; return '<button class="order-chip '+(i===0?'active':'')+'" onclick="jumpToSection(\''+secId+'\')">'+(i+1)+'. '+sec.name+'</button>';}).join('')+
      '<button class="order-chip" onclick="addArrangementSlotPrompt()">+ Add to order</button></div>'+
      '<h4 style="margin-top:10px">Chord Order (whole song, live)</h4>'+
      '<div class="chord-order-strip">'+flat.map(function(c){
        const r = realizeChord(c.token, c.qualityOverride, s.key);
        return '<button class="co-chip '+(c.color||'blue')+' '+(c.id===state.selectedChordId?'selected':'')+'" onclick="selectChord(\''+c.id+'\')"><b>'+displayChordText(r)+'</b><small>'+c.sectionName+'</small></button>';
      }).join('')+'</div>'+
    '</div>'+

    '<div class="row" style="margin-bottom:6px">'+
      '<button class="btn sm" onclick="addSection()">+ Add Section</button>'+
      '<button class="btn sm" onclick="toast(\'Song saved locally.\')">Save</button>'+
    '</div>'+

    sections.map(function(sec){return renderSection(sec,s);}).join('');
}
function renderSection(sec,s){
  return '<section class="section" id="sec-'+sec.id+'">'+
    '<div class="section-head">'+
      '<h3 class="section-title"><span class="dot '+sec.color+'"></span><input value="'+sec.name+'" onchange="renameSection(\''+sec.id+'\',this.value)"></h3>'+
      '<div class="section-toolbar">'+
        '<button class="btn sm" onclick="addChordToSection(\''+sec.id+'\')">+ Chord</button>'+
        '<button class="btn sm" onclick="duplicateSection(\''+sec.id+'\')">Duplicate</button>'+
        '<button class="btn sm blue" onclick="openSheet(\'applyPathToSection\',\''+sec.id+'\')">Apply Path</button>'+
        '<button class="btn sm red" onclick="removeSection(\''+sec.id+'\')">Remove</button>'+
      '</div>'+
    '</div>'+
    '<div class="chord-grid">'+sec.chords.map(function(c,idx){return renderChordCard(c,sec,s,idx);}).join('')+'</div>'+
  '</section>';
}
function renderChordCard(c,sec,s,idx){
  const r = realizeChord(c.token, c.qualityOverride, s.key);
  const color = c.color || sec.color;
  return '<button class="chord '+color+' '+(state.selectedChordId===c.id?'selected':'')+'"'+
    ' draggable="true" ondragstart="dragStart(event,\''+c.id+'\')" ondragover="dragOver(event)" ondragleave="dragLeave(event)" ondrop="dropChord(event,\''+sec.id+'\',\''+c.id+'\')"'+
    ' onclick="selectChord(\''+c.id+'\')">'+
    '<span class="handle" draggable="true" ondragstart="dragStart(event,\''+c.id+'\')">\u2630</span>'+
    '<div class="sym">'+displayChordText(r)+'</div>'+
    '<div class="num">'+sec.name+'</div>'+
    '<div class="movebtns"><button onclick="event.stopPropagation();moveChord(\''+sec.id+'\',\''+c.id+'\',-1)">\u2190</button><button onclick="event.stopPropagation();moveChord(\''+sec.id+'\',\''+c.id+'\',1)">\u2192</button></div>'+
  '</button>';
}
function renderInspector(){
  const c = selectedChordRealized();
  if(!c) return '';
  const s = currentSong();
  return '<div class="panel-head"><h2 class="label">Chord Detail</h2><span class="pill">'+c.numberDisplay+'</span></div>'+
  '<div class="panel-body inspector">'+
    '<div><div class="big-chord">'+c.symbol+'</div><div class="muted">'+c.numberDisplay+' in '+s.key+' \u00b7 piano voicing</div></div>'+
    '<div class="voicing"><b>Fingering</b><p>'+c.lh+'</p><strong>'+c.rh+'</strong><div class="fg">'+c.fingering+'</div></div>'+
    '<button class="btn sm" onclick="state.showExplanation=!state.showExplanation;saveState();render()">'+(state.showExplanation?'Hide':'Show')+' explanation</button>'+
    '<p class="muted hideable '+(state.showExplanation?'':'is-hidden')+'">'+c.desc+'</p>'+
    '<div><h3 class="label" style="margin-bottom:8px">Replace selected chord</h3><div class="option-list">'+renderReplaceOptions(c.qualityKey)+'</div></div>'+
    '<div class="row"><button class="btn sm blue" onclick="setTab(\'chord\')">Open Chord Lab</button><button class="btn sm blue" onclick="jumpToLickFor()">Make Lick</button></div>'+
  '</div>';
}
function renderReplaceOptions(currentQ){
  const opts = ['maj9','maj13','maj13#11','min9','min11','min13','dom9','13sus','13b9','6/9','add2'].filter(function(q){return q!==currentQ;}).slice(0,6);
  return opts.map(function(q){
    const desc = QUALITY_DESC[q];
    const label = CHORD_TYPES[q].label || 'triad';
    return '<button class="option" onclick="replaceSelectedQuality(\''+q+'\')"><span><b>'+label+'</b><small>'+desc+'</small></span><span class="use">Use</span></button>';
  }).join('');
}
function replaceSelectedQuality(q){
  const found = findChordRaw(state.selectedChordId);
  if(!found) return;
  found.chord.qualityOverride = q;
  found.song.updatedAt = Date.now();
  saveState(); render(); showPeek();
  toast('Replaced selected chord.');
}

/* Song mutation actions */
function openSong(id){const s=state.songs.find(function(x){return x.id===id;}); if(!s)return; state.songId=id; const first=allChordsOrdered(s)[0]; state.selectedChordId=first?first.id:null; saveState(); render();}
function changeSongKey(key){currentSong().key=key; currentSong().updatedAt=Date.now(); saveState(); render(); toast('Key changed to '+key+'. All chords recalculated.');}
function addSong(){
  const id='song'+Date.now();
  const sec = section(id+'sec','Verse','green',[chord(id+'c1','1','green')]);
  const sg = song(id,'New Song','F','custom','My Songs',[sec],[sec.id],['custom']);
  sg.isBuiltIn=false;
  state.songs.push(sg);
  state.songId=id; state.selectedChordId=id+'c1'; saveState(); render();
}
function duplicateSong(){
  const s = JSON.parse(JSON.stringify(currentSong()));
  const nid='copy'+Date.now();
  const idMap={};
  s.sections.forEach(function(sec){const oldId=sec.id; sec.id='sec'+Math.random().toString(36).slice(2); idMap[oldId]=sec.id; sec.chords.forEach(function(c){c.id='c'+Math.random().toString(36).slice(2);});});
  s.arrangement = s.arrangement.map(function(id){return idMap[id]||id;});
  s.id=nid; s.title=s.title+' Copy'; s.isBuiltIn=false;
  state.songs.push(s); state.songId=nid; state.selectedChordId=s.sections[0].chords[0].id; saveState(); render();
  toast('Song duplicated.');
}
function addSection(){
  const s=currentSong(); const id='sec'+Date.now();
  const sec = section(id,'New Section','yellow',[chord(id+'c','1','yellow')]);
  s.sections.push(sec); s.arrangement.push(id); saveState(); render();
}
function renameSection(id,name){const s=currentSong(); const sec=s.sections.find(function(x){return x.id===id;}); if(sec){sec.name=name; saveState();}}
function duplicateSection(id){
  const s=currentSong(); const sec=s.sections.find(function(x){return x.id===id;}); if(!sec) return;
  const copy = JSON.parse(JSON.stringify(sec)); copy.id='sec'+Date.now(); copy.name=sec.name+' Copy';
  copy.chords.forEach(function(c){c.id='c'+Math.random().toString(36).slice(2);});
  s.sections.push(copy); s.arrangement.push(copy.id); saveState(); render(); toast('Section duplicated.');
}
function removeSection(id){
  const s=currentSong(); if(s.sections.length<=1){toast('A song needs at least one section.'); return;}
  s.sections = s.sections.filter(function(x){return x.id!==id;}); s.arrangement = s.arrangement.filter(function(x){return x!==id;});
  saveState(); render();
}
function addChordToSection(secId){
  const s=currentSong(); const sec=s.sections.find(function(x){return x.id===secId;}); if(!sec) return;
  const id='c'+Date.now(); sec.chords.push(chord(id,'1','yellow'));
  state.selectedChordId=id; saveState(); render();
}
function jumpToSection(id){const el=document.getElementById('sec-'+id); if(el) el.scrollIntoView({behavior:'smooth',block:'start'});}
function addArrangementSlotPrompt(){
  const s=currentSong();
  openSheetCustom('Add section to song order', '<div class="option-list">'+s.sections.map(function(sec){return '<button class="option" onclick="addToArrangement(\''+sec.id+'\')"><span><b>'+sec.name+'</b></span><span class="use">Add</span></button>';}).join('')+'</div>');
}
function addToArrangement(secId){currentSong().arrangement.push(secId); saveState(); render(); closeSheet();}

/* Drag + move */
let draggedId=null;
function dragStart(e,id){draggedId=id; try{e.dataTransfer.setData('text/plain',id);}catch(err){} const el=e.currentTarget.closest('.chord'); if(el) el.classList.add('dragging');}
function dragOver(e){e.preventDefault(); e.currentTarget.classList.add('over');}
function dragLeave(e){e.currentTarget.classList.remove('over');}
function dropChord(e,sectionId,targetId){
  e.preventDefault();
  document.querySelectorAll('.chord').forEach(function(x){x.classList.remove('over','dragging');});
  if(!draggedId||draggedId===targetId) return;
  const sec = currentSong().sections.find(function(s){return s.id===sectionId;}); if(!sec) return;
  const from = sec.chords.findIndex(function(c){return c.id===draggedId;});
  const to = sec.chords.findIndex(function(c){return c.id===targetId;});
  if(from<0||to<0) return;
  const moved = sec.chords.splice(from,1)[0]; sec.chords.splice(to,0,moved);
  saveState(); render(); toast('Progression reordered.');
}
function moveChord(sectionId,chordId,dir){
  const sec = currentSong().sections.find(function(s){return s.id===sectionId;}); if(!sec) return;
  const idx = sec.chords.findIndex(function(c){return c.id===chordId;}); const to = idx+dir;
  if(to<0||to>=sec.chords.length) return;
  const moved = sec.chords.splice(idx,1)[0]; sec.chords.splice(to,0,moved);
  saveState(); render();
}

/* ============================== PLAYLISTS ============================== */
function renderPlaylistsPage(){
  return '<div class="two-col">'+
    '<aside class="panel">'+
      '<div class="panel-head"><h2 class="label">Library</h2></div>'+
      '<div class="panel-body">'+
        '<div class="subtabs">'+
          '<button class="subtab '+(state.songsSubTab==='songs'?'active':'')+'" onclick="setSongsSubTab(\'songs\')">Songs</button>'+
          '<button class="subtab '+(state.songsSubTab==='playlists'?'active':'')+'" onclick="setSongsSubTab(\'playlists\')">Playlists</button>'+
        '</div>'+
        '<button class="btn primary" onclick="addPlaylist()">+ New Playlist</button>'+
      '</div>'+
    '</aside>'+
    '<section class="panel">'+
      '<div class="panel-head"><h2 class="label">Playlists</h2><span class="pill">'+state.playlists.length+' saved</span></div>'+
      '<div class="panel-body playlist-list">'+
        state.playlists.map(function(pl){return '<div class="playlist-card">'+
          '<div class="spread"><strong>'+pl.title+'</strong><div class="row"><button class="btn sm green" onclick="openPlaylistInLive(\''+pl.id+'\')">Open in Live</button><button class="btn sm" onclick="renamePlaylistPrompt(\''+pl.id+'\')">Rename</button><button class="btn sm red" onclick="removePlaylist(\''+pl.id+'\')">Delete</button></div></div>'+
          pl.items.map(function(it,i){const s=state.songs.find(function(x){return x.id===it.songId;}); if(!s) return ''; return '<div class="playlist-item"><span>'+(i+1)+'. '+s.title+' \u2014 Key '+(it.keyOverride||s.key)+'</span><div class="pl-btns"><button onclick="moveplaylistItem(\''+pl.id+'\',\''+it.id+'\',-1)">\u2191</button><button onclick="moveplaylistItem(\''+pl.id+'\',\''+it.id+'\',1)">\u2193</button><button onclick="removeFromPlaylist(\''+pl.id+'\',\''+it.id+'\')">Remove</button></div></div>';}).join('')+
          '<button class="btn sm" style="margin-top:8px" onclick="addSongToPlaylistPrompt(\''+pl.id+'\')">+ Add Song</button>'+
        '</div>';}).join('')+
      '</div>'+
    '</section>'+
  '</div>';
}
function addPlaylist(){const id='pl'+Date.now(); state.playlists.push({id:id,title:'New Playlist',items:[],createdAt:Date.now(),updatedAt:Date.now()}); saveState(); render(); toast('Playlist created.');}
function renamePlaylistPrompt(id){const pl=state.playlists.find(function(p){return p.id===id;}); const name=prompt('Rename playlist',pl.title); if(name){pl.title=name; saveState(); render();}}
function removePlaylist(id){state.playlists=state.playlists.filter(function(p){return p.id!==id;}); saveState(); render();}
function addSongToPlaylistPrompt(plId){
  openSheetCustom('Add a song', '<div class="option-list">'+state.songs.map(function(s){return '<button class="option" onclick="addSongToPlaylist(\''+plId+'\',\''+s.id+'\')"><span><b>'+s.title+'</b><small>Key '+s.key+'</small></span><span class="use">Add</span></button>';}).join('')+'</div>');
}
function addToPlaylistPrompt(songId){
  let html = '<div class="option-list">';
  html += state.playlists.map(function(p){return '<button class="option" onclick="addSongToPlaylist(\''+p.id+'\',\''+songId+'\')"><span><b>'+p.title+'</b></span><span class="use">Add</span></button>';}).join('');
  html += '<button class="option" onclick="addPlaylist();addSongToPlaylist(state.playlists[state.playlists.length-1].id,\''+songId+'\')"><span><b>+ New Playlist</b></span><span class="use">Create</span></button>';
  html += '</div>';
  openSheetCustom('Add to playlist', html);
}
function addSongToPlaylist(plId,songId){
  const pl = state.playlists.find(function(p){return p.id===plId;}); if(!pl) return;
  pl.items.push({id:'pi'+Date.now(),songId:songId,keyOverride:null}); saveState(); render(); closeSheet(); toast('Added to playlist.');
}
function removeFromPlaylist(plId,itemId){const pl=state.playlists.find(function(p){return p.id===plId;}); pl.items=pl.items.filter(function(i){return i.id!==itemId;}); saveState(); render();}
function moveplaylistItem(plId,itemId,dir){
  const pl=state.playlists.find(function(p){return p.id===plId;}); const idx=pl.items.findIndex(function(i){return i.id===itemId;}); const to=idx+dir;
  if(to<0||to>=pl.items.length) return;
  const m=pl.items.splice(idx,1)[0]; pl.items.splice(to,0,m); saveState(); render();
}
function openPlaylistInLive(id){state.liveSource='playlist'; state.livePlaylistId=id; state.livePlaylistIndex=0; state.liveIndex=0; setTab('live');}

/* ============================== PATH PAGE ============================== */
function renderPathPage(){
  const f = state.pathForm;
  return '<div class="two-col">'+
    '<section class="panel">'+
      '<div class="panel-head"><h2 class="label">Path Builder</h2><span class="pill">Build a route</span></div>'+
      '<div class="panel-body grid">'+
        '<div class="builder-grid">'+
          '<div class="field"><label>Key</label>'+keySelectHTML(f.key,"updatePathForm('key',this.value)")+'</div>'+
          '<div class="field"><label>I am on</label><select onchange="updatePathForm(\'from\',this.value)">'+[1,2,3,4,5,6,7].map(function(n){return '<option value="'+n+'" '+(+f.from===n?'selected':'')+'>'+n+'</option>';}).join('')+'</select></div>'+
          '<div class="field"><label>I want to go to</label><select onchange="updatePathForm(\'to\',this.value)">'+[1,2,3,4,5,6,7].map(function(n){return '<option value="'+n+'" '+(+f.to===n?'selected':'')+'>'+n+'</option>';}).join('')+'</select></div>'+
          '<div class="field"><label>Style</label><select onchange="updatePathForm(\'style\',this.value)">'+['Safe','Gospel','CCM','Weird Reharm','Preacher','Shout'].map(function(x){return '<option '+(f.style===x?'selected':'')+'>'+x+'</option>';}).join('')+'</select></div>'+
          '<div class="field"><label>Intensity</label><select onchange="updatePathForm(\'intensity\',this.value)">'+['Easy','Churchy','Crunchy','Shed'].map(function(x){return '<option '+(f.intensity===x?'selected':'')+'>'+x+'</option>';}).join('')+'</select></div>'+
          '<div class="field">'+viewToggleHTML()+'</div>'+
        '</div>'+
        '<div class="field"><label>Or type a progression (numbers, e.g. 1 - 4 - 3dom - 5 - b6 - b7)</label><input value="'+f.custom+'" oninput="state.pathForm.custom=this.value" placeholder="1 - 4 - 3dom - 5"></div>'+
        '<div class="row"><button class="btn primary" onclick="buildRoutes()">Build Routes</button>'+(f.custom?'<button class="btn" onclick="buildCustomRoute()">Build From Typed Progression</button>':'')+'</div>'+
        renderRouteResults()+
      '</div>'+
    '</section>'+
    '<aside class="panel">'+
      '<div class="panel-head"><h2 class="label">Current Song</h2><button class="btn sm" onclick="setTab(\'songs\')">Open</button></div>'+
      '<div class="panel-body">'+renderSmallChart()+'</div>'+
    '</aside>'+
  '</div>';
}
function updatePathForm(field,value){state.pathForm[field]=(field==='from'||field==='to')?+value:value; saveState(); render();}
function buildRoutes(){
  const f = state.pathForm;
  const selected = f.style;
  const crunchyIntensity = f.intensity === 'Shed' ? 'Shed' : 'Crunchy';
  state.pathResults = [
    {name:'Safe Route', lane:'safe', style:'Safe', intensity:'Easy', steps: buildRoute(f.key, +f.from, +f.to, 'Safe', 'Easy')},
    {name:(selected==='Safe'?'Gospel':selected)+' Churchy Route', lane:'churchy', style:selected==='Safe'?'Gospel':selected, intensity:'Churchy', steps: buildRoute(f.key, +f.from, +f.to, selected==='Safe'?'Gospel':selected, 'Churchy')},
    {name:(selected==='Safe'?'Gospel':selected)+' '+crunchyIntensity+' Route', lane:crunchyIntensity.toLowerCase(), style:selected==='Safe'?'Gospel':selected, intensity:crunchyIntensity, steps: buildRoute(f.key, +f.from, +f.to, selected==='Safe'?'Gospel':selected, crunchyIntensity)}
  ];
  saveState(); render(); toast('Built 3 route options.');
}
function buildCustomRoute(){
  const f = state.pathForm;
  const tokens = parseProgressionTokens(f.custom);
  const steps = tokens.map(function(tok){
    const r = realizeChord(tok, null, f.key);
    return {token:tok, qualityKey:r.qualityKey, symbol:r.symbol, lh:r.lh, rh:r.rh, fingering:r.fingering};
  });
  state.pathResults = [
    {name:'Typed Progression', lane:'churchy', intensity:f.intensity, steps:steps},
    {name:'Typed Progression - Fatter', lane:'crunchy', intensity:'Crunchy', steps:steps.map(function(st){ const q = st.qualityKey==='maj'?'maj13':st.qualityKey==='min'?'min11':st.qualityKey==='dom7'?'13sus':st.qualityKey; const rr=realizeChord(st.token,q,f.key); return {token:st.token, qualityKey:rr.qualityKey, symbol:rr.symbol, lh:rr.lh, rh:rr.rh, fingering:rr.fingering}; })}
  ];
  saveState(); render(); toast('Built typed route from '+tokens.length+' tokens.');
}
function renderRouteResults(){
  if(!state.pathResults) return '<p class="muted">No routes yet. Set your inputs and tap Build Routes.</p>';
  let html = '<div class="result-list">'+state.pathResults.map(function(r,ri){
    return '<div class="route-card route-'+(r.lane||String(r.intensity).toLowerCase())+'">'+
    '<div class="spread"><div><b>'+r.name+'</b><p class="muted" style="margin:.2rem 0 0">'+r.intensity+' intensity \u00b7 '+r.steps.length+' chords</p></div></div>'+
    '<div class="chord-line">'+r.steps.map(function(st){return '<span class="token '+colorFor(st.qualityKey)+'">'+(state.view==='numbers'?st.token:state.view==='chords'?st.symbol:st.symbol+' / '+st.token)+'</span>';}).join('')+'</div>'+
    '<div class="route-actions">'+
      '<button class="btn sm blue" onclick="openSheet(\'applyRoute\','+ri+')">Apply Route</button>'+
      '<button class="btn sm" onclick="openSheet(\'applyRoute\','+ri+')">Choose Placement</button>'+
      '<button class="btn sm" onclick="savePathRoute('+ri+')">Save to My Paths</button>'+
      '<button class="btn sm" onclick="adjustRouteIntensity('+ri+',-1)">Make Simpler</button>'+
      '<button class="btn sm" onclick="adjustRouteIntensity('+ri+',1)">Make Fatter</button>'+
    '</div></div>';
  }).join('')+'</div>';
  if(state.paths.length){
    html += '<h3 class="label" style="margin-top:14px">My Saved Paths</h3><div class="option-list">'+state.paths.map(function(p,i){return '<button class="option" onclick="loadSavedPath('+i+')"><span><b>'+p.name+'</b><small>'+p.steps.map(function(s){return s.token;}).join(' \u2192 ')+'</small></span><span class="use">Load</span></button>';}).join('')+'</div>';
  }
  return html;
}
function selectedSection(){
  const found = findChordRaw(state.selectedChordId);
  if(found) return found.section;
  return currentSong().sections[0];
}
function routeToChords(route,prefix){
  return route.steps.map(function(st,i){return chord((prefix||'rt')+Date.now()+i, st.token, colorFor(st.qualityKey), st.qualityKey);});
}
function useRouteInCurrentSong(ri){ openSheet('applyRoute', ri); }
function applyRouteAction(ri,mode,sectionId){
  const route = state.pathResults && state.pathResults[ri];
  if(!route){toast('Build a route first.'); return;}
  const s = currentSong();
  const newChords = routeToChords(route,'ar');
  const found = findChordRaw(state.selectedChordId);
  let targetSection = sectionId ? s.sections.find(function(x){return x.id===sectionId;}) : selectedSection();
  if(mode==='replaceChord'){
    if(!found){toast('Select a chord first.'); return;}
    const idx = found.section.chords.findIndex(function(c){return c.id===found.chord.id;});
    found.section.chords.splice.apply(found.section.chords,[idx,1].concat(newChords));
    state.selectedChordId = newChords[0].id;
    toast('Route inserted where selected chord was.');
  } else if(mode==='replaceSection'){
    if(!targetSection){toast('Choose a section first.'); return;}
    targetSection.chords = newChords;
    state.selectedChordId = newChords[0].id;
    toast('Section replaced with route.');
  } else if(mode==='appendSection'){
    if(!targetSection){toast('Choose a section first.'); return;}
    targetSection.chords = targetSection.chords.concat(newChords);
    state.selectedChordId = newChords[0].id;
    toast('Route appended to section.');
  } else if(mode==='newSection'){
    const id='pathsec'+Date.now();
    const sec = section(id, route.name, route.lane==='safe'?'green':route.lane==='churchy'?'blue':'red', newChords);
    s.sections.push(sec); s.arrangement.push(id);
    state.selectedChordId = newChords[0].id;
    toast('Route added as new section.');
  }
  s.updatedAt=Date.now();
  saveState(); closeSheet(); setTab('songs');
}
function adjustRouteIntensity(ri,dir){
  const order=['Easy','Churchy','Crunchy','Shed'];
  let idx = order.indexOf(state.pathForm.intensity)+dir;
  idx = Math.max(0,Math.min(order.length-1,idx));
  state.pathForm.intensity = order[idx];
  buildRoutes();
}
function savePathRoute(ri){
  const route = state.pathResults[ri];
  state.paths.push({id:'path'+Date.now(), name: route.name+' ('+state.pathForm.key+')', steps: route.steps});
  saveState(); render(); toast('Saved to My Paths.');
}
function loadSavedPath(i){state.pathResults=[{name:state.paths[i].name, intensity:state.pathForm.intensity, steps:state.paths[i].steps}]; saveState(); render();}
function applyPathToSection(sectionId){
  if(!state.pathResults){toast('Build a route first.'); return;}
  const route = state.pathResults[0];
  const sec = currentSong().sections.find(function(x){return x.id===sectionId;}); if(!sec) return;
  sec.chords = route.steps.map(function(st,i){return chord('rp'+Date.now()+i, st.token, colorFor(st.qualityKey), st.qualityKey);});
  state.selectedChordId = sec.chords[0].id;
  saveState(); closeSheet(); setTab('songs'); toast('Section replaced with path.');
}
function renderSmallChart(){const s=currentSong(); return '<h2 style="margin-top:0">'+s.title+'</h2>'+orderedSections(s).map(function(sec){return renderSection(sec,s);}).join('');}

/* ============================== CHORD LAB ============================== */
const LEVEL_PALETTES = {
  Easy:   [{deg:'1',q:null},{deg:'1',q:'add2'},{deg:'1',q:'maj6'},{deg:'4',q:null},{deg:'5',q:null},{deg:'2m',q:null}],
  Churchy:[{deg:'1',q:'maj9'},{deg:'1',q:'6/9'},{deg:'4',q:'maj9'},{deg:'5',q:'dom9'},{deg:'2m',q:'min9'},{deg:'6m',q:'min9'}],
  Crunchy:[{deg:'1',q:'maj13'},{deg:'4',q:'maj13#11'},{deg:'2m',q:'min11'},{deg:'5',q:'13sus'},{deg:'5',q:'13b9'},{deg:'3m',q:'min11'}],
  Shed:   [{deg:'1',q:'maj13#11'},{deg:'7',q:'7alt'},{deg:'4',q:'maj13'},{deg:'2',q:'7alt'},{deg:'5',q:'13b9'},{deg:'5',q:'13sus'}]
};
function renderChordLabPage(){
  const f = state.chordLabForm;
  const palette = LEVEL_PALETTES[f.level];
  const selected = state.chordLabSelected || palette[0];
  const r = realizeChord(selected.deg, selected.q, f.key);
  return '<div class="two-col">'+
    '<section class="panel">'+
      '<div class="panel-head"><h2 class="label">Chord Lab</h2><span class="pill">'+f.level+'</span></div>'+
      '<div class="panel-body grid">'+
        '<div class="builder-grid">'+
          '<div class="field"><label>Key</label>'+keySelectHTML(f.key,"updateChordLabForm('key',this.value)")+'</div>'+
          '<div class="field"><label>Level</label><select onchange="updateChordLabForm(\'level\',this.value)">'+['Easy','Churchy','Crunchy','Shed'].map(function(x){return '<option '+(f.level===x?'selected':'')+'>'+x+'</option>';}).join('')+'</select></div>'+
          '<div class="field"><label>Style</label><select onchange="updateChordLabForm(\'style\',this.value)">'+['Gospel','CCM','Shout','Preacher','Weird Reharm','Organ'].map(function(x){return '<option '+(f.style===x?'selected':'')+'>'+x+'</option>';}).join('')+'</select></div>'+
          '<div class="field span">'+viewToggleHTML()+'</div>'+
        '</div>'+
        '<div class="voicing"><div class="big-chord">'+(state.view==='numbers'?r.numberDisplay:r.symbol)+'</div><p>'+r.lh+'</p><strong>'+r.rh+'</strong><div class="fg">'+r.fingering+'</div><p class="muted" style="margin-top:8px">'+r.desc+'</p></div>'+
        '<h3 class="label">'+f.level+' Palette</h3>'+
        '<div class="fat-palette">'+palette.map(function(p,i){const rr=realizeChord(p.deg,p.q,f.key); return '<button class="fat" onclick="selectChordLab('+i+')"><b>'+(state.view==='numbers'?rr.numberDisplay:rr.symbol)+'</b><small>'+(QUALITY_DESC[rr.qualityKey]||'')+'</small></button>';}).join('')+'</div>'+
        '<div class="row"><button class="btn sm blue" onclick="replaceSelectedFromChordLab()">Replace Selected Song Chord</button><button class="btn sm" onclick="jumpToLickFromLab()">Send to Licks</button></div>'+
      '</div>'+
    '</section>'+
    '<aside class="panel">'+
      '<div class="panel-head"><h2 class="label">Where Next?</h2></div>'+
      '<div class="panel-body grid">'+
        '<p class="muted">Where do you want to go from '+(state.view==='numbers'?r.numberDisplay:r.symbol)+'?</p>'+
        '<div class="degree-row">'+['1','2m','3dom','4','5','6m','b6','b7'].map(function(d){return '<button class="degree-btn '+(state.whereNext===d?'active':'')+'" onclick="whereNext(\''+d+'\')">'+d+'</button>';}).join('')+'</div>'+
        renderWhereNextResult(f,r)+
      '</div>'+
    '</aside>'+
  '</div>';
}
function updateChordLabForm(field,value){state.chordLabForm[field]=value; state.chordLabSelected=null; state.whereNext=null; state.whereNextRoute=null; saveState(); render();}
function selectChordLab(i){state.chordLabSelected = LEVEL_PALETTES[state.chordLabForm.level][i]; saveState(); render();}
function replaceSelectedFromChordLab(){
  const f = state.chordLabForm; const palette = LEVEL_PALETTES[f.level]; const sel = state.chordLabSelected || palette[0];
  const found = findChordRaw(state.selectedChordId); if(!found){toast('Select a chord in Songs first.'); return;}
  const replacement = replacementFromChordLabSelection(sel, currentSong().key);
  applyChordReplacement(found.chord, replacement);
  found.song.updatedAt = Date.now();
  saveState(); render(); showPeek(); toast('Replaced chord with '+replacement.realized.symbol+'.');
}
function whereNext(targetDeg){
  state.whereNext = targetDeg;
  const f = state.chordLabForm; const palette=LEVEL_PALETTES[f.level]; const sel = state.chordLabSelected || palette[0];
  const r = realizeChord(sel.deg, sel.q, f.key);
  const fromMatch = sel.deg.match(/^([b#]?)(\d)/);
  const fromDegNum = fromMatch?+fromMatch[2]:1;
  const toMatch = targetDeg.match(/^([b#]?)(\d)/);
  const toDegNum = toMatch?+toMatch[2]:4;
  state.whereNextRoute = buildRoute(f.key, fromDegNum, toDegNum, f.style==='Organ'?'Gospel':f.style, f.level);
  saveState(); render();
}
function renderWhereNextResult(f,r){
  if(!state.whereNextRoute) return '<p class="muted">Tap a target above to build a route there.</p>';
  const route = state.whereNextRoute;
  return '<div class="route-card"><b>From '+(state.view==='numbers'?r.numberDisplay:r.symbol)+' to '+route[route.length-1].symbol+'</b>'+
    '<div class="chord-line">'+route.map(function(st){return '<span class="token '+colorFor(st.qualityKey)+'">'+(state.view==='numbers'?st.token:st.symbol)+'</span>';}).join('')+'</div>'+
    '<div class="route-actions">'+
      '<button class="btn sm blue" onclick="useWhereNextRoute()">Use Route</button>'+
      '<button class="btn sm" onclick="saveWhereNextRoute()">Save</button>'+
      '<button class="btn sm" onclick="sendWhereNextToPath()">Send to Path</button>'+
    '</div></div>';
}
function useWhereNextRoute(){
  if(!state.whereNextRoute){toast('Build a Where Next route first.'); return;}
  state.pathResults=[{name:'Where Next Route', lane:'churchy', intensity:state.chordLabForm.level, steps:state.whereNextRoute}];
  saveState(); openSheet('applyRoute',0);
}
function saveWhereNextRoute(){state.paths.push({id:'path'+Date.now(), name:'Where Next ('+state.chordLabForm.key+')', steps: state.whereNextRoute}); saveState(); toast('Saved to My Paths.');}
function sendWhereNextToPath(){state.pathResults=[{name:'From Chord Lab', intensity:state.chordLabForm.level, steps:state.whereNextRoute}]; saveState(); setTab('path');}
function jumpToLickFromLab(){const f=state.chordLabForm; const palette=LEVEL_PALETTES[f.level]; const sel=state.chordLabSelected||palette[0]; state.lickForm.key=f.key; state.lickForm.from=sel.deg; saveState(); setTab('licks');}
function jumpToLickFor(){const c=selectedChordRealized(); if(c){state.lickForm.key=currentSong().key; state.lickForm.from=c.numberDisplay;} saveState(); setTab('licks');}

/* ============================== LICKS ============================== */
function renderLicksPage(){
  const f = state.lickForm;
  return '<div class="two-col">'+
    '<section class="panel">'+
      '<div class="panel-head"><h2 class="label">Lick Builder</h2><span class="pill">Target-aware runs</span></div>'+
      '<div class="panel-body grid">'+
        '<div class="builder-grid">'+
          '<div class="field"><label>Key</label>'+keySelectHTML(f.key,"updateLickForm('key',this.value)")+'</div>'+
          '<div class="field"><label>Starting chord</label><input value="'+f.from+'" oninput="state.lickForm.from=this.value"></div>'+
          '<div class="field"><label>Target</label><input value="'+f.to+'" oninput="state.lickForm.to=this.value"></div>'+
          '<div class="field"><label>Style</label><select onchange="updateLickForm(\'style\',this.value)">'+['Gospel','Blues','Shout','CCM','Organ'].map(function(x){return '<option '+(f.style===x?'selected':'')+'>'+x+'</option>';}).join('')+'</select></div>'+
          '<div class="field"><label>Speed</label><select onchange="updateLickForm(\'speed\',this.value)">'+['Slow','Medium','Fast'].map(function(x){return '<option '+(f.speed===x?'selected':'')+'>'+x+'</option>';}).join('')+'</select></div>'+
          '<div class="field"><label>Difficulty</label><select onchange="updateLickForm(\'difficulty\',this.value)">'+['Easy','Churchy','Shed'].map(function(x){return '<option '+(f.difficulty===x?'selected':'')+'>'+x+'</option>';}).join('')+'</select></div>'+
        '</div>'+
        '<button class="btn primary" onclick="makeLick()">Make Lick</button>'+
        (state.lickResult?renderLickResult():'<p class="muted">No lick yet. Set your inputs and tap Make Lick.</p>')+
      '</div>'+
    '</section>'+
    '<aside class="panel">'+
      '<div class="panel-head"><h2 class="label">Saved Licks</h2></div>'+
      '<div class="panel-body option-list">'+
        (state.licks.length?state.licks.map(function(l,i){return '<button class="option" onclick="loadSavedLick('+i+')"><span><b>'+l.title+'</b><small>'+l.notes+'</small></span><span class="use">Edit</span></button>';}).join(''):'<p class="muted">No saved licks yet.</p>')+
      '</div>'+
    '</aside>'+
  '</div>';
}
function updateLickForm(field,value){state.lickForm[field]=value; saveState(); render();}
function makeLick(){
  const f = state.lickForm;
  const r = generateLick(f.key, f.from, f.to, f.style, f.speed, f.difficulty);
  state.lickResult = Object.assign({title:'Lick into '+realizeChord(f.to,null,f.key).symbol}, r);
  saveState(); render(); toast('New lick generated.');
}
function renderLickResult(){
  const l = state.lickResult;
  return '<div class="route-card">'+
    '<b>'+l.title+'</b>'+
    '<p class="muted" style="margin:4px 0 8px">'+l.use+'</p>'+
    '<label class="muted" style="font-size:.72rem;text-transform:uppercase">Notes (editable)</label>'+
    '<textarea class="lick-notes" oninput="state.lickResult.notes=this.value">'+l.notes+'</textarea>'+
    '<p class="muted">Numbers: '+l.numbers+'</p>'+
    '<p class="muted">'+l.fingering+'</p>'+
    '<div class="route-actions">'+
      '<button class="btn sm" onclick="adjustLick(\'easier\')">Make Easier</button>'+
      '<button class="btn sm" onclick="adjustLick(\'faster\')">Make Faster</button>'+
      '<button class="btn sm" onclick="adjustLick(\'gospel\')">Make More Gospel</button>'+
      '<button class="btn sm blue" onclick="attachLickToSelected()">Attach to Current Chord</button>'+
      '<button class="btn sm green" onclick="saveLick()">Save to Licks</button>'+
    '</div>'+
  '</div>';
}
function adjustLick(kind){
  const f = state.lickForm;
  if(kind==='easier') f.difficulty='Easy';
  if(kind==='faster') f.speed='Fast';
  if(kind==='gospel') f.style='Gospel';
  makeLick();
}
function attachLickToSelected(){
  const found = findChordRaw(state.selectedChordId);
  if(!found){toast('Select a chord in Songs first.'); return;}
  found.chord.notes = (found.chord.notes?found.chord.notes+' | ':'')+'Lick: '+state.lickResult.notes;
  saveState(); toast('Lick attached to selected chord.');
}
function saveLick(){
  const l = state.lickResult;
  state.licks.push({id:'lick'+Date.now(), title:l.title, key:state.lickForm.key, notes:l.notes, numbers:l.numbers, fingering:l.fingering, use:l.use});
  saveState(); render(); toast('Saved to Licks.');
}
function loadSavedLick(i){const l=state.licks[i]; state.lickResult={title:l.title, notes:l.notes, numbers:l.numbers, fingering:l.fingering, use:l.use}; saveState(); render();}

/* ============================== SHOUT ============================== */
const SHOUT_PATTERNS = [
  {name:'Basic Shout', steps:['1','4','1/5','5']},
  {name:'Walkup', steps:['1','2','3','4','5']},
  {name:'Preacher Punch', steps:['1','b7','4','5']},
  {name:'Turnaround', steps:['6m','2m','5dom','1']},
  {name:'Ending', steps:['1','4','#4dim','1/5','5','1']}
];
function renderShoutPage(){
  const key = state.chordLabForm.key;
  return '<section class="panel">'+
    '<div class="panel-head"><h2 class="label">Shout / Praise Break</h2><div class="row"><span class="pill">'+keySelectHTML(key,"state.chordLabForm.key=this.value;saveState();render()")+'</span>'+viewToggleHTML()+'</div></div>'+
    '<div class="panel-body grid"><div class="shout-grid">'+SHOUT_PATTERNS.map(function(p,i){
      const realized = p.steps.map(function(tok){const r=realizeChord(tok,null,key); return Object.assign({},r,{token:tok});});
      return '<div class="route-card">'+
        '<div class="spread"><div><b>'+p.name+'</b><p class="muted">Key '+key+'</p></div></div>'+
        '<div class="chord-line">'+realized.map(function(r){return '<span class="token '+colorFor(r.qualityKey)+'">'+(state.view==='numbers'?r.numberDisplay:state.view==='chords'?r.symbol:r.symbol+' / '+r.numberDisplay)+'</span>';}).join('')+'</div>'+
        '<div class="route-actions">'+
          '<button class="btn sm blue" onclick="sendShoutToLive('+i+')">Send to Live</button>'+
          '<button class="btn sm" onclick="saveShoutToSong('+i+')">Save to Song</button>'+
          '<button class="btn sm" onclick="toast(\'Organ version: use Shout Lead preset on Organ tab.\')">Make Organ Version</button>'+
        '</div></div>';
    }).join('')+'</div></div>'+
  '</section>';
}
function saveShoutToSong(i){
  const key = state.chordLabForm.key; const p = SHOUT_PATTERNS[i];
  const s = currentSong();
  const id='shout'+Date.now();
  const sec = section(id,p.name,'orange', p.steps.map(function(tok,j){return chord(id+'c'+j, tok, 'orange');}));
  s.sections.push(sec); s.arrangement.push(id);
  saveState(); render(); toast(p.name+' added as a new section in '+s.title+'.');
}
function sendShoutToLive(i){
  saveShoutToSong(i);
  setTab('live');
}

/* ============================== ORGAN ============================== */
function renderOrganPage(){
  return '<section class="panel">'+
    '<div class="panel-head"><h2 class="label">Organ</h2><span class="pill">Drawbars \u00b7 Leslie \u00b7 manuals</span></div>'+
    '<div class="panel-body grid"><div class="preset-grid">'+state.organPresets.map(function(p,i){return '<div class="preset">'+
      '<h3>'+p.title+'</h3>'+
      renderDrawbars(p.upper)+
      renderDrawbars(p.lower)+
      '<p class="muted" style="margin-top:8px"><b>Upper</b> '+p.upper+' \u00b7 <b>Lower</b> '+p.lower+'<br>Percussion: '+p.percussion+' \u00b7 Chorus: '+p.chorus+' \u00b7 Leslie: '+p.leslie+'<br>Expression: '+p.expression+'</p>'+
      '<p class="muted">'+p.use+'</p>'+
      '<div class="row"><button class="btn sm blue" onclick="attachOrganToSelected('+i+')">Attach to chord</button><button class="btn sm" onclick="openSheet(\'editOrgan\','+i+')">Edit</button></div>'+
    '</div>';}).join('')+'</div>'+
    '<button class="btn primary" onclick="openSheet(\'editOrgan\',-1)">+ New Custom Preset</button></div>'+
  '</section>';
}
function renderDrawbars(value){
  const bars = String(value).padEnd(9,'0').split('').slice(0,9).map(Number);
  return '<div class="drawbars-h">'+bars.map(function(v,i){return '<div class="bar"><span>Bar '+(i+1)+'</span><input type="range" min="0" max="8" value="'+v+'" disabled><span>'+v+'</span></div>';}).join('')+'</div>'+
  '<div class="drawbars-v">'+bars.map(function(v){return '<i style="height:'+((v/8*100)||6)+'%"></i>';}).join('')+'</div>';
}
function attachOrganToSelected(i){
  const found = findChordRaw(state.selectedChordId);
  if(!found){toast('Select a chord in Songs first.'); return;}
  const p = state.organPresets[i];
  found.chord.notes = (found.chord.notes?found.chord.notes+' | ':'')+'Organ: '+p.title;
  saveState(); toast(p.title+' attached to selected chord.');
}
function editOrganPreset(i, field, value){
  if(i<0){ if(!state._draftOrgan) state._draftOrgan={title:'New Preset',upper:'000000000',lower:'000000000',percussion:'Off',chorus:'C3',leslie:'Slow',expression:'40-60%',use:''}; state._draftOrgan[field]=value; }
  else state.organPresets[i][field]=value;
}
function saveOrganDraft(){
  if(state._draftOrgan){ state._draftOrgan.id='op'+Date.now(); state.organPresets.push(state._draftOrgan); state._draftOrgan=null; }
  saveState(); closeSheet(); render(); toast('Preset saved.');
}

/* ============================== LIVE ============================== */
function liveSongAndKey(){
  if(state.liveSource==='playlist' && state.livePlaylistId){
    const pl = state.playlists.find(function(p){return p.id===state.livePlaylistId;});
    if(pl && pl.items.length){
      const item = pl.items[state.livePlaylistIndex % pl.items.length];
      const s = state.songs.find(function(x){return x.id===item.songId;});
      if(s) return {song:s, key:item.keyOverride||s.key, playlist:pl, item:item};
    }
  }
  const s = currentSong();
  return {song:s, key: state.liveKeyOverride||s.key};
}
function renderLivePage(){
  const lk = liveSongAndKey(); const s = lk.song; const key = lk.key; const playlist = lk.playlist;
  const sections = orderedSections(s);
  const sec = sections[state.liveIndex % sections.length];
  return '<section class="live-page"><div class="live-card">'+
    '<div class="spread">'+
      '<div>'+
        '<div class="row" style="margin-bottom:10px">'+
          '<div class="seg"><button class="'+(state.liveSource==='song'?'active':'')+'" onclick="setLiveSource(\'song\')">Song</button><button class="'+(state.liveSource==='playlist'?'active':'')+'" onclick="setLiveSource(\'playlist\')">Playlist</button></div>'+
          viewToggleHTML()+
        '</div>'+
        '<div class="picker-row">'+
          '<div class="field"><label>Choose Song</label><select onchange="setLiveSong(this.value)">'+state.songs.map(function(song){return '<option value="'+song.id+'" '+(song.id===s.id?'selected':'')+'>'+song.title+'</option>';}).join('')+'</select></div>'+
          '<div class="field"><label>Choose Playlist</label><select onchange="setLivePlaylist(this.value)"><option value="">None</option>'+state.playlists.map(function(pl){return '<option value="'+pl.id+'" '+(state.livePlaylistId===pl.id?'selected':'')+'>'+pl.title+'</option>';}).join('')+'</select></div>'+
        '</div>'+
        '<h1 class="live-title">'+s.title+'</h1>'+
        '<div class="row" style="margin-top:10px">'+
          '<span class="pill">Key '+key+'</span>'+
          (playlist?'<span class="pill">'+playlist.title+'</span>':'')+
          '<span class="pill click '+(state.liveLocked?'active':'')+'" onclick="toggleLiveLock()">'+(state.liveLocked?'Locked':'Unlocked')+'</span>'+
        '</div>'+
      '</div>'+
      '<div class="row">'+
        '<button class="btn sm" onclick="liveKeyShift(-1)">Key -</button>'+
        '<button class="btn sm" onclick="liveKeyShift(1)">Key +</button>'+
      '</div>'+
    '</div>'+
    '<div class="live-section">'+sec.name+'</div>'+
    '<div class="live-grid">'+sec.chords.map(function(c){const r=realizeChord(c.token,c.qualityOverride,key); return '<button class="live-chord '+(c.color||sec.color)+'" onclick="liveChordPeek(\''+c.id+'\',\''+key+'\')"><b>'+displayChordText(r)+'</b><span>'+sec.name+'</span></button>';}).join('')+'</div>'+
    '<div class="live-controls">'+
      '<button class="btn" onclick="livePrevSong()">Prev Song</button>'+
      '<button class="btn" onclick="livePrevSection()">Prev Section</button>'+
      '<button class="btn" onclick="liveNextSection()">Next Section</button>'+
      '<button class="btn" onclick="liveNextSong()">Next Song</button>'+
      '<button class="btn red" onclick="toast(\'Ending: resolve to the 1, fingers off slow.\')">Ending</button>'+
      '<button class="btn" onclick="liveRepeat()">Repeat Section</button>'+
    '</div>'+
  '</div></section>';
}
function setLiveSource(src){state.liveSource=src; state.liveIndex=0; saveState(); render();}
function setLiveSong(songId){state.songId=songId; state.liveSource='song'; state.liveIndex=0; state.liveKeyOverride=null; saveState(); render();}
function setLivePlaylist(plId){if(!plId){state.livePlaylistId=null; state.liveSource='song';} else {state.livePlaylistId=plId; state.liveSource='playlist'; state.livePlaylistIndex=0;} state.liveIndex=0; saveState(); render();}
function liveKeyShift(dir){
  const lk = liveSongAndKey(); const key = lk.key;
  const idx = (keyIndex(key)+dir+12)%12;
  if(state.liveSource==='playlist' && lk.playlist){
    lk.item.keyOverride = PITCH[idx];
  } else { state.liveKeyOverride = PITCH[idx]; }
  saveState(); render();
}
function toggleLiveLock(){state.liveLocked=!state.liveLocked; saveState(); render();}
function liveNextSection(){const lk=liveSongAndKey(); state.liveIndex=(state.liveIndex+1)%orderedSections(lk.song).length; saveState(); render();}
function livePrevSection(){const lk=liveSongAndKey(); state.liveIndex=(state.liveIndex-1+orderedSections(lk.song).length)%orderedSections(lk.song).length; saveState(); render();}
function liveRepeat(){render();}
function liveNextSong(){
  if(state.liveSource==='playlist' && state.livePlaylistId){
    const pl = state.playlists.find(function(p){return p.id===state.livePlaylistId;});
    state.livePlaylistIndex=(state.livePlaylistIndex+1)%pl.items.length; state.liveIndex=0; saveState(); render();
  } else { toast('Switch Live Source to Playlist to move between songs.'); }
}
function livePrevSong(){
  if(state.liveSource==='playlist' && state.livePlaylistId){
    const pl = state.playlists.find(function(p){return p.id===state.livePlaylistId;});
    state.livePlaylistIndex=(state.livePlaylistIndex-1+pl.items.length)%pl.items.length; state.liveIndex=0; saveState(); render();
  } else { toast('Switch Live Source to Playlist to move between songs.'); }
}
function sendSongToLive(id){state.liveSource='song'; state.songId=id; state.liveIndex=0; setTab('live');}
function liveChordPeek(chordId,key){
  const found = findChordRaw(chordId); if(!found) return;
  const r = realizeChord(found.chord.token, found.chord.qualityOverride, key);
  showPeekData(r, false);
}

/* ============================== PEEK (mobile chord bottom sheet) ============================== */
function showPeek(){
  const c = selectedChordRealized(); if(!c) return;
  showPeekData(c, true);
}
function showPeekData(r, withActions){
  const el = document.getElementById('peek');
  el.innerHTML = '<div class="peek-head"><div><div class="peek-title">'+r.symbol+'</div><div class="muted">'+r.numberDisplay+'</div></div><button class="peek-close" onclick="closePeek()">\u00d7</button></div>'+
  '<div class="voicing"><div>'+r.lh+'</div><strong>'+r.rh+'</strong><div class="fg">'+r.fingering+'</div></div>'+
  (withActions?'<div class="row" style="margin-top:10px"><button class="btn sm" onclick="setTab(\'chord\')">More</button><button class="btn sm blue" onclick="openSheet(\'replace\')">Replace</button><button class="btn sm green" onclick="jumpToLickFor()">Lick</button></div>':'');
  el.classList.add('show');
}
function closePeek(){const el=document.getElementById('peek'); if(el) el.classList.remove('show');}

/* ============================== SHEETS (mobile bottom modal) ============================== */
function openMoreSheet(){
  openSheetCustom('More', '<div class="option-list">'+
    '<button class="option" onclick="closeSheet();setTab(\'shout\')"><span><b>Shout</b><small>Praise break patterns</small></span><span class="use">Open</span></button>'+
    '<button class="option" onclick="closeSheet();setTab(\'organ\')"><span><b>Organ</b><small>Drawbars & presets</small></span><span class="use">Open</span></button>'+
    '<button class="option" onclick="closeSheet();openSettings()"><span><b>Settings</b></span><span class="use">Open</span></button>'+
  '</div>');
}
function openSettings(){
  openSheetCustom('Settings', '<div class="settings-sheet-body">'+
    '<div class="field"><label>Theme</label><div class="seg"><button class="'+(state.theme==='dark'?'active':'')+'" onclick="setTheme(\'dark\')">Dark</button><button class="'+(state.theme==='light'?'active':'')+'" onclick="setTheme(\'light\')">Light</button></div></div>'+
    '<div class="field"><label>Global View</label>'+viewToggleHTML()+'</div>'+
    '<p class="muted">Songs, playlists, licks, paths, and presets all save automatically on this device.</p>'+
  '</div>');
}
function setTheme(t){state.theme=t; document.documentElement.dataset.theme=t; saveState(); render(); openSettings();}
function openSheet(kind,arg){
  if(kind==='replace'){
    const c = selectedChordRealized();
    openSheetCustom('Replace '+c.symbol, '<div class="option-list">'+renderReplaceOptions(c.qualityKey)+'</div>');
    return;
  }

  if(kind==='applyRoute'){
    const route = state.pathResults && state.pathResults[arg];
    if(!route){toast('Build a route first.'); return;}
    const s = currentSong();
    const selected = selectedSection();
    const sectionOptions = s.sections.map(function(sec){return '<option value="'+sec.id+'" '+(selected && selected.id===sec.id?'selected':'')+'>'+sec.name+'</option>';}).join('');
    openSheetCustom('Apply '+route.name, '<div class="settings-sheet-body">'+
      '<p class="muted">Choose exactly where this route should go. Nothing will be replaced until you choose.</p>'+
      '<div class="field"><label>Target section</label><select id="applySectionSelect">'+sectionOptions+'</select></div>'+
      '<div class="apply-grid">'+
        '<button class="btn blue" onclick="applyRouteAction('+arg+',\'replaceChord\')">Replace selected chord with this route</button>'+
        '<button class="btn" onclick="applyRouteAction('+arg+',\'replaceSection\',document.getElementById(\'applySectionSelect\').value)">Replace selected section</button>'+
        '<button class="btn" onclick="applyRouteAction('+arg+',\'appendSection\',document.getElementById(\'applySectionSelect\').value)">Append to section</button>'+
        '<button class="btn green" onclick="applyRouteAction('+arg+',\'newSection\')">Add as new section</button>'+
      '</div></div>');
    return;
  }
  if(kind==='replaceSectionWithRoute'){
    const s = currentSong();
    openSheetCustom('Replace which section?', '<div class="option-list">'+s.sections.map(function(sec){return '<button class="option" onclick="replaceSectionWithRoute(\''+sec.id+'\','+arg+')"><span><b>'+sec.name+'</b></span><span class="use">Replace</span></button>';}).join('')+'</div>');
    return;
  }
  if(kind==='applyPathToSection'){
    if(!state.pathResults){toast('Build a route on the Path tab first.'); return;}
    applyPathToSection(arg); return;
  }
  if(kind==='editOrgan'){
    const p = arg>=0?state.organPresets[arg]:{title:'New Preset',upper:'000000000',lower:'000000000',percussion:'Off',chorus:'C3',leslie:'Slow',expression:'40-60%',use:''};
    openSheetCustom('Organ Preset', '<div class="settings-sheet-body">'+
      '<div class="field"><label>Title</label><input value="'+p.title+'" oninput="editOrganPreset('+arg+',\'title\',this.value)"></div>'+
      '<div class="field"><label>Upper drawbars (9 digits)</label><input value="'+p.upper+'" oninput="editOrganPreset('+arg+',\'upper\',this.value)"></div>'+
      '<div class="field"><label>Lower drawbars (9 digits)</label><input value="'+p.lower+'" oninput="editOrganPreset('+arg+',\'lower\',this.value)"></div>'+
      '<div class="field"><label>Percussion</label><select onchange="editOrganPreset('+arg+',\'percussion\',this.value)"><option '+(p.percussion==='Off'?'selected':'')+'>Off</option><option '+(p.percussion==='On'?'selected':'')+'>On</option></select></div>'+
      '<div class="field"><label>Leslie</label><input value="'+p.leslie+'" oninput="editOrganPreset('+arg+',\'leslie\',this.value)"></div>'+
      '<div class="field"><label>Expression</label><input value="'+p.expression+'" oninput="editOrganPreset('+arg+',\'expression\',this.value)"></div>'+
      '<div class="field"><label>Use case</label><input value="'+p.use+'" oninput="editOrganPreset('+arg+',\'use\',this.value)"></div>'+
      '<button class="btn primary" onclick="'+(arg>=0?'closeSheet();render()':'saveOrganDraft()')+'">'+(arg>=0?'Done':'Save Preset')+'</button>'+
    '</div>');
    return;
  }
}
function replaceSectionWithRoute(sectionId,ri){
  const route = state.pathResults[ri];
  const sec = currentSong().sections.find(function(x){return x.id===sectionId;}); if(!sec) return;
  sec.chords = route.steps.map(function(st,i){return chord('rp'+Date.now()+i, st.token, colorFor(st.qualityKey), st.qualityKey);});
  state.selectedChordId = sec.chords[0].id; saveState(); closeSheet(); render(); toast('Section replaced with route.');
}
function openSheetCustom(title, bodyHTML){
  document.getElementById('sheet').innerHTML = '<div class="spread" style="margin-bottom:10px"><h2 class="label">'+title+'</h2><button class="peek-close" onclick="closeSheet()">\u00d7</button></div>'+bodyHTML;
  document.getElementById('sheet').classList.add('show');
  document.getElementById('sheetBackdrop').classList.add('show');
}
function closeSheet(){document.getElementById('sheet').classList.remove('show'); document.getElementById('sheetBackdrop').classList.remove('show');}

render();
