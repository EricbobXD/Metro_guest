const line = (id, name, color, stops, kind = '主線') => ({ id, name, color, kind, stops: stops.split('>') });
export const networks = [
  { id: 'tra', name: '台鐵', english: 'TAIWAN RAILWAYS', mark: 'TR', color: '#2463ac', description: '沿著鐵道，環島一圈。', lines: [
    line('tr-north', '縱貫線・北段', '#2463ac', '基隆>三坑>八堵>七堵>百福>五堵>汐止>汐科>南港>松山>臺北>萬華>板橋>浮洲>樹林>南樹林>山佳>鶯歌>鳳鳴>桃園>內壢>中壢>平鎮>埔心>楊梅>富岡>新富>北湖>湖口>新豐>竹北>北新竹>新竹>三姓橋>香山>崎頂>竹南'),
    line('tr-coast', '縱貫線・海線', '#269a9b', '竹南>談文>大山>後龍>龍港>白沙屯>新埔>通霄>苑裡>日南>大甲>臺中港>清水>沙鹿>龍井>大肚>追分>彰化'),
    line('tr-mountain', '臺中線・山線', '#8763b3', '竹南>造橋>豐富>苗栗>南勢>銅鑼>三義>泰安>后里>豐原>栗林>潭子>頭家厝>松竹>太原>精武>臺中>五權>大慶>烏日>新烏日>成功>彰化'),
    line('tr-south', '縱貫線・南段', '#d28e35', '彰化>花壇>大村>員林>永靖>社頭>田中>二水>林內>石榴>斗六>斗南>石龜>大林>民雄>嘉北>嘉義>水上>南靖>後壁>新營>柳營>林鳳營>隆田>拔林>善化>南科>新市>永康>大橋>臺南>保安>仁德>中洲>大湖>路竹>岡山>橋頭>楠梓>新左營>左營>內惟>美術館>鼓山>三塊厝>高雄'),
    line('tr-pingtung', '屏東線', '#bf6d56', '高雄>民族>科工館>正義>鳳山>後庄>九曲堂>六塊厝>屏東>歸來>麟洛>西勢>竹田>潮州>崁頂>南州>鎮安>林邊>佳冬>東海>枋寮'),
    line('tr-southlink', '南迴線', '#b89745', '枋寮>加祿>內獅>枋山>枋野>大武>瀧溪>金崙>太麻里>知本>康樂>臺東'),
    line('tr-taitung', '臺東線', '#4b9b69', '花蓮>吉安>志學>平和>壽豐>豐田>林榮新光>南平>鳳林>萬榮>光復>大富>富源>瑞穗>三民>玉里>東里>東竹>富里>池上>海端>關山>瑞和>瑞源>鹿野>山里>臺東'),
    line('tr-northlink', '北迴線', '#3d98b4', '蘇澳新>永樂>東澳>南澳>武塔>漢本>和平>和仁>崇德>新城>景美>北埔>花蓮'),
    line('tr-yilan', '宜蘭線', '#638ab7', '八堵>暖暖>四腳亭>瑞芳>猴硐>三貂嶺>牡丹>雙溪>貢寮>福隆>石城>大里>大溪>龜山>外澳>頭城>頂埔>礁溪>四城>宜蘭>二結>中里>羅東>冬山>新馬>蘇澳新>蘇澳'),
    line('tr-pingxi', '平溪線', '#a56f9d', '三貂嶺>大華>十分>望古>嶺腳>平溪>菁桐', '支線'),
    line('tr-neiwan', '內灣線', '#a58556', '新竹>北新竹>千甲>新莊>竹中>上員>榮華>竹東>橫山>九讚頭>合興>富貴>內灣', '支線'),
    line('tr-liujia', '六家線', '#cb8a58', '竹中>六家', '支線'),
    line('tr-chengzhui', '成追線', '#7a8e61', '追分>成功', '支線'),
    line('tr-jiji', '集集線', '#799453', '二水>源泉>濁水>龍泉>集集>水里>車埕', '支線'),
    line('tr-shalun', '沙崙線', '#aa784e', '中洲>長榮大學>沙崙', '支線'),
    line('tr-shenao', '深澳線', '#4a96a4', '瑞芳>海科館>八斗子', '支線'),
    line('tr-hualienport', '花蓮臨港線', '#527C89', '北埔>花蓮港', '貨運支線'),
  ] },
  { id: 'hsr', name: '高鐵', english: 'TAIWAN HIGH SPEED RAIL', mark: 'HS', color: '#df783c', description: '十二站，串起西部的日常。', lines: [
    line('hsr-main', '台灣高鐵', '#df783c', '南港>台北>板橋>桃園>新竹>苗栗>台中>彰化>雲林>嘉義>台南>左營'),
  ] },
  { id: 'north', name: '雙北＋桃園', english: 'TAIPEI · NEW TAIPEI · TAOYUAN', mark: 'M', color: '#21836e', description: '從城市巷弄，到山海之間。', lines: [
    line('r', '淡水信義線', '#db4d50', '淡水>紅樹林>竹圍>關渡>忠義>復興崗>北投>奇岩>唭哩岸|陽明交通大學>石牌|榮總>明德>芝山>士林>劍潭|北藝中心>圓山>民權西路>雙連|馬偕紀念醫院>中山>台北車站>台大醫院>中正紀念堂|南門>東門>大安森林公園>大安>信義安和>台北101/世貿>象山>廣慈/奉天宮|松山慈惠堂'),
    line('r-branch', '新北投支線', '#e58c8e', '北投>新北投', '支線'),
    line('g', '松山新店線', '#328965', '松山>南京三民>台北小巨蛋>南京復興>松江南京>中山>北門|大稻埕南>西門>小南門>中正紀念堂|南門>古亭>台電大樓>公館|台灣大學>萬隆>景美>大坪林>七張>新店區公所>新店|碧潭'),
    line('g-branch', '小碧潭支線', '#7dbd8a', '七張>小碧潭|新店高中', '支線'),
    line('o', '中和新蘆線・共用段', '#e5a135', '南勢角>景安>永安市場>頂溪>古亭>東門>忠孝新生|台北科大>松江南京>行天宮>中山國小|晴光商圈>民權西路>大橋頭|大橋國小'),
    line('o-xinzhuang', '中和新蘆線・新莊分支', '#e5a135', '大橋頭|大橋國小>台北橋>菜寮|新北市立醫院>三重>先嗇宮>頭前庄|臺北醫院>新莊|新莊廟街>輔大>丹鳳>迴龍|樂生'),
    line('o-luzhou', '中和新蘆線・蘆洲分支', '#e5a135', '大橋頭|大橋國小>三重國小>三和國中>徐匯中學>三民高中|空中大學>蘆洲|蘆洲李宅'),
    line('bl', '板南線', '#387fc2', '頂埔>永寧>土城>海山|新北高工>亞東醫院|亞東科大>府中|林家花園>板橋>新埔|致理科大>江子翠>龍山寺|艋舺商圈>西門>台北車站>善導寺|華山>忠孝新生|台北科大>忠孝復興>忠孝敦化>國父紀念館>市政府>永春>後山埤|五分埔商圈>昆陽>南港>南港展覽館'),
    line('br', '文湖線', '#a77c4b', '動物園>木柵>萬芳社區>萬芳醫院>辛亥>麟光>六張犁>科技大樓>大安>忠孝復興>南京復興>中山國中>松山機場>大直|實踐大學>劍南路|美麗華>西湖|德明科大>港墘>文德|碧湖公園>內湖>大湖公園>葫洲>東湖>南港軟體園區>南港展覽館'),
    line('gondola', '貓空纜車', '#a5b65d', '動物園>動物園南>指南宮>貓空'),
    line('y', '環狀線・西環段', '#c9a62c', '大坪林>十四張|莊敬高職>秀朗橋>景平>景安>中和>橋和>中原>板新>板橋>新埔民生>頭前庄|臺北醫院>幸福>新北產業園區'),
    line('lb', '三鶯線', '#67a8d1', '頂埔>媽祖田>長壽山>橫溪>龍埔|三峽廣行宮>三峽|國家教育研究院>臺北大學|恩主公醫院>鶯歌車站|新北市美術館>陶瓷老街>國華>永吉公園>鶯桃福德'),
    line('a', '桃園機場捷運', '#8b65a6', '台北車站>三重>新北產業園區>新莊副都心>泰山>泰山貴和>體育大學|龜山樂善>長庚醫院>林口>山鼻>坑口>機場第一航廈>機場第二航廈>機場旅館>大園>橫山>領航|大園國際高中>高鐵桃園站>桃園體育園區>興南>環北>老街溪'),
    line('v', '淡海輕軌・共用段', '#dc8e93', '紅樹林>竿蓁林>淡金鄧公>淡江大學>淡金北新|北投子>新市一路>淡水行政中心>濱海義山>濱海沙崙'),
    line('v-green', '淡海輕軌・綠山分支', '#dc8e93', '濱海沙崙>淡海新市鎮>崁頂'),
    line('v-blue', '淡海輕軌・藍海分支', '#5ba2ba', '濱海沙崙>台北海洋大學>沙崙>淡水漁人碼頭'),
    line('k', '安坑輕軌', '#9baf55', '雙城>玫瑰中國城>台北小城>耕莘安康院區>景文科大>安康>陽光運動公園>新和國小>十四張'),
  ] },
  { id: 'taichung', name: '台中', english: 'TAICHUNG METRO', mark: 'M', color: '#6c9651', description: '沿著綠線，慢慢熟悉這座城。', lines: [
    line('tc-green', '綠線', '#6c9651', '北屯總站>舊社>松竹>四維國小>文心崇德>文心中清>文華高中>文心櫻花>市政府>水安宮>文心森林公園>南屯>豐樂公園>大慶>九張犁>九德>烏日>高鐵臺中站'),
  ] },
  { id: 'kaohsiung', name: '高雄', english: 'KAOHSIUNG METRO & LIGHT RAIL', mark: 'M', color: '#df7758', description: '港都的每一站，都是新的風景。', lines: [
    line('kh-r', '紅線', '#d94d50', '岡山車站>岡山高醫>橋頭火車站>橋頭糖廠>青埔>都會公園>後勁>楠梓科技園區>油廠國小>世運>左營|高鐵站>生態園區>巨蛋>凹子底>後驛>高雄車站>美麗島>中央公園>三多商圈>獅甲>凱旋>前鎮高中>草衙>高雄國際機場>小港'),
    line('kh-o', '橘線', '#e69a3f', '哈瑪星>鹽埕埔>前金>美麗島>信義國小>文化中心>五塊厝>苓雅運動園區>衛武營>鳳山西站|高雄市議會>鳳山>大東>鳳山國中>大寮'),
    { ...line('kh-c', '環狀輕軌', '#78a55a', '籬仔內>凱旋瑞田>前鎮之星>凱旋中華>夢時代>經貿園區>軟體園區>高雄展覽館>旅運中心>光榮碼頭>真愛碼頭>駁二大義>駁二蓬萊>哈瑪星>壽山公園|金馬賓館當代美術館>文武聖殿>鼓山區公所>鼓山>馬卡道>臺鐵美術館>內惟藝術中心>美術館>聯合醫院>龍華國小>愛河之心>新上國小>大順民族>灣仔內|大順鼎山>高雄高工>樹德家商>科工館>聖功醫院|道明中學>凱旋公園>衛生局>五權國小>凱旋武昌>凱旋二聖>輕軌機廠'), loop: true },
  ] },
];

// IDs distinguish identically named stations that are not physically connected.
export function routeGroups(network) {
  const merged = network.id === 'north' ? { r: ['r', 'r-branch'], g: ['g', 'g-branch'], o: ['o', 'o-xinzhuang', 'o-luzhou'], v: ['v', 'v-green', 'v-blue'] } : {};
  const children = new Set(Object.values(merged).flatMap(ids => ids.slice(1)));
  return network.lines.filter(l => !children.has(l.id)).map(l => {
    const segments = (merged[l.id] || [l.id]).map(id => network.lines.find(item => item.id === id));
    return { ...l, name: l.id === 'o' ? '中和新蘆線' : l.id === 'v' ? '淡海輕軌' : l.name, segments,
      stops: [...new Map(segments.flatMap(segment => segment.stops.map(raw => [stationId(network.id, segment.id, raw), raw]))).values()] };
  });
}

export function routeLayout(group) {
  const step = 76, nodes = [], paths = [];
  const add = (segment, stops, x, y) => stops.forEach((raw, i) => nodes.push({ raw, lineId: segment.id, x: x + i * step, y }));
  const original = group.segments[0];
  const main = ['r','g','kh-r'].includes(original.id) ? { ...original, stops: [...original.stops].reverse() } : original;
  const branching = group.segments.length > 1, mainY = branching ? 145 : 40;
  add(main, main.stops, 38, mainY);
  paths.push(`M38 ${mainY} H${38 + (main.stops.length - 1) * step}`);
  group.segments.slice(1).forEach((segment, index) => {
    const anchor = main.stops.findIndex(raw => raw.split('|')[0] === segment.stops[0].split('|')[0]);
    const anchorX = 38 + anchor * step, y = index === 0 ? 40 : 250, x = anchorX + step;
    add(segment, segment.stops.slice(1), x, y);
    paths.push(`M${anchorX} ${mainY} C${anchorX + 38} ${mainY} ${anchorX + 38} ${y} ${x} ${y} H${x + (segment.stops.length - 2) * step}`);
  });
  return { nodes, paths, width: Math.max(...nodes.map(n => n.x)) + 48, height: branching ? (group.segments.length > 2 ? 390 : 285) : 180 };
}

export function stationCode(network, lineId, raw) {
  const segment = network.lines.find(l => l.id === lineId), index = segment.stops.indexOf(raw);
  const padded = n => String(n).padStart(2, '0');
  if (network.id === 'taichung') return index === 0 ? '103a' : String(102+index);
  if (network.id === 'kaohsiung') {
    if(lineId === 'kh-r') return ['RK01','R24','R23','R22A','R22','R21','R20','R19','R18','R17','R16','R15','R14','R13','R12','R11','R10','R09','R08','R07','R06','R05','R04A','R04','R03'][index];
    if(lineId === 'kh-o') return ['O01','O02','O04','O05','O06','O07','O08','O09','O10','O11','O12','O13','O14','OT01'][index];
    if(lineId === 'kh-c') return index === 20 ? 'C21A' : `C${padded(index<20?index+1:index)}`;
  }
  if (network.id !== 'north') return null;
  if (lineId === 'r') return `R${padded(28-index)}`;
  if (lineId === 'g') return `G${padded(19-index)}`;
  if (lineId === 'r-branch') return index === 0 ? 'R22' : 'R22A';
  if (lineId === 'g-branch') return index === 0 ? 'G03' : 'G03A';
  if (lineId === 'o') return `O${padded(index+1)}`;
  if (lineId === 'o-xinzhuang') return `O${padded(index+12)}`;
  if (lineId === 'o-luzhou') return index === 0 ? 'O12' : `O${padded(index+49)}`;
  if (lineId === 'a') return index === 13 ? 'A14a' : `A${padded(index+1)}`;
  const specs = { bl:['BL',1], br:['BR',1], y:['Y',7], lb:['LB',1], v:['V',1], 'v-green':['V',9], k:['K',1] };
  if (lineId === 'v-blue') return index === 0 ? 'V09' : `V${29-index}`;
  if (specs[lineId]) return `${specs[lineId][0]}${padded(specs[lineId][1]+index)}`;
  return padded(index+1);
}

export function groupTerminals(network, group) {
  if (group.loop) return new Set();
  const neighbors=new Map();
  for(const segment of group.segments){
    const ids=segment.stops.map(raw=>stationId(network.id,segment.id,raw));
    for(const id of ids)if(!neighbors.has(id))neighbors.set(id,new Set());
    ids.slice(1).forEach((id,i)=>{neighbors.get(id).add(ids[i]);neighbors.get(ids[i]).add(id);});
  }
  return new Set([...neighbors].filter(([,edges])=>edges.size===1).map(([id])=>id));
}

export function stationId(network, lineId, raw) {
  const name = raw.split('|')[0].replaceAll('臺', '台');
  if (network === 'north' && lineId === 'a' && name === '台北車站') return '台北車站:機捷';
  if (network === 'north' && name === '動物園' && lineId === 'gondola') return '動物園:纜車';
  if (network === 'tra' && name === '新莊') return '新莊:內灣線';
  return name;
}

export const normalize = value => value.normalize('NFKC').replaceAll('臺', '台').replace(/[\s｜|（）()]/g, '').replaceAll('／', '/');
export const displayName = (raw, subtitle) => raw.split('|').slice(0, subtitle ? 2 : 1).join(' | ');
export function stationsFor(network, lines = network.lines) {
  const result = new Map();
  for (const l of lines) for (const raw of l.stops) {
    const id = stationId(network.id, l.id, raw);
    if (!result.has(id)) result.set(id, { id, raw, lines: [] });
    const station = result.get(id);
    if (raw.includes('|')) station.raw = raw;
    station.lines.push(l);
  }
  return [...result.values()];
}

export function transferLabel(line) {
  if (line.id === 'r-branch') return '淡水信義線';
  if (line.id === 'g-branch') return '松山新店線';
  if (line.id.startsWith('o-') || line.id === 'o') return '中和新蘆線';
  if (line.id.startsWith('v')) return '淡海輕軌';
  return line.name;
}

// Keep the route challenge's merged line names; show branch destinations on maps.
const branchNames = { 'r-branch':'新北投支線', 'g-branch':'小碧潭支線', 'o-xinzhuang':'新莊分支', 'o-luzhou':'蘆洲分支', 'v-green':'綠山線', 'v-blue':'藍海線' };
export function branchTransfers(network,station){
  if(network.id!=='north'||station.lines.length<2)return [];
  return [...new Set(station.lines.filter(line=>station.lines.some(other=>other.id!==line.id&&transferLabel(other)===transferLabel(line))).map(line=>branchNames[line.id]).filter(Boolean))];
}
export function mapTransfers(network,station,lineId){
  const own=transferLabel(network.lines.find(line=>line.id===lineId));
  return [...new Set([...transferOptions(network,station).filter(label=>label!==own),...branchTransfers(network,station)])];
}
// Explicit walk connections: preserve both station names during route answering.
export const walkConnections = { north: [['動物園', '動物園:纜車'], ['新埔', '新埔民生'], ['北門', '台北車站:機捷']], kaohsiung: [['凱旋','前鎮之星'], ['凹子底','愛河之心'], ['苓雅運動園區','凱旋公園']] };

export function buildGraph(network) {
  const graph = new Map(stationsFor(network).map(s => [s.id, new Set()]));
  const connect = (a, b) => { graph.get(a)?.add(b); graph.get(b)?.add(a); };
  for (const l of network.lines) {
    const ids = l.stops.map(s => stationId(network.id, l.id, s));
    ids.slice(1).forEach((id, i) => connect(ids[i], id));
    if (l.loop) connect(ids.at(-1), ids[0]);
  }
  for (const [a, b] of walkConnections[network.id] || []) connect(a, b);
  return graph;
}
export function distances(graph, destination) {
  const result = new Map([[destination, 0]]), queue = [destination];
  for (let i = 0; i < queue.length; i++) for (const next of graph.get(queue[i]) || []) {
    if (!result.has(next)) { result.set(next, result.get(queue[i]) + 1); queue.push(next); }
  }
  return result;
}
export function validNext(graph, distance, current, candidate) {
  return !!graph.get(current)?.has(candidate) && distance.get(candidate) === distance.get(current) - 1;
}

// Inter-system connections are kept separate from station identity.
export const externalTransfers = {
  tra: { '松山': ['松山新店線'], '台北': ['高鐵', '淡水信義線', '板南線', '桃園機場捷運'], '南港': ['高鐵', '板南線'], '板橋': ['高鐵', '板南線', '環狀線'], '新竹': ['內灣線'], '北新竹': ['內灣線'], '六家': ['高鐵'], '豐富': ['高鐵'], '松竹': ['台中捷運綠線'], '大慶': ['台中捷運綠線'], '新烏日': ['高鐵', '台中捷運綠線'], '新左營': ['高鐵', '高雄捷運紅線'], '高雄': ['高雄捷運紅線'], '岡山': ['高雄捷運紅線'], '橋頭': ['高雄捷運紅線'], '鼓山': ['環狀輕軌'], '美術館': ['環狀輕軌'], '科工館': ['環狀輕軌'], '沙崙': ['高鐵'], '鶯歌': ['三鶯線'] },
  north: { '台北車站': ['台鐵', '高鐵'], '南港': ['台鐵', '高鐵'], '板橋': ['台鐵', '高鐵'], '松山': ['台鐵'], '鶯歌車站': ['台鐵'], '高鐵桃園站': ['高鐵'] },
  taichung: { '松竹': ['台鐵'], '大慶': ['台鐵'], '高鐵台中站': ['台鐵', '高鐵'] },
  kaohsiung: { '岡山車站': ['台鐵'], '橋頭火車站': ['台鐵'], '左營': ['台鐵', '高鐵'], '高雄車站': ['台鐵'], '鼓山': ['台鐵'], '台鐵美術館': ['台鐵'], '科工館': ['台鐵'] },
};
export const hsrTransfers = {
  '南港': ['台鐵・南港', '板南線・南港'],
  '台北': ['台鐵・臺北', '淡水信義線・台北車站', '板南線・台北車站', '桃園機場捷運・台北車站'],
  '板橋': ['台鐵・板橋', '板南線・板橋', '環狀線・板橋'],
  '桃園': ['桃園機場捷運・高鐵桃園站'],
  '新竹': ['台鐵・六家'],
  '苗栗': ['台鐵・豐富'],
  '台中': ['台鐵・新烏日', '台中捷運綠線・高鐵臺中站'],
  '彰化': [], '雲林': [], '嘉義': [],
  '台南': ['台鐵・沙崙'],
  '左營': ['台鐵・新左營', '高雄捷運紅線・左營'],
};
export function transferOptions(network, station) {
  if (network.id === 'hsr') return hsrTransfers[station.id] || [];
  const labels = [...new Set(station.lines.map(transferLabel))];
  const extra = externalTransfers[network.id]?.[station.id] || [];
  const walking = network.id === 'north' ? { '新埔': ['環狀線'], '新埔民生': ['板南線'], '北門': ['桃園機場捷運'], '台北車站:機捷': ['桃園機場捷運'], '動物園': ['貓空纜車'], '動物園:纜車': ['文湖線'] }[station.id] || [] : network.id === 'kaohsiung' ? { '凱旋':['環狀輕軌'], '前鎮之星':['紅線'], '凹子底':['環狀輕軌'], '愛河之心':['紅線'], '苓雅運動園區':['環狀輕軌'], '凱旋公園':['橘線'] }[station.id] || [] : [];
  if (labels.length < 2 && !extra.length && !walking.length) return [];
  return [...new Set([...labels, ...extra, ...walking])];
}
