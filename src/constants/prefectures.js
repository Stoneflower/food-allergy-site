// 都道府県データ（47都道府県）
export const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県", 
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県"
];

// 都道府県名の判定用ヘルパー関数
export const isPrefectureName = (input) => {
  if (!input) return false;
  
  const inputLower = input.toLowerCase();
  
  return PREFECTURES.some(pref => {
    const prefLower = pref.toLowerCase();
    
    // 完全一致
    if (inputLower.includes(prefLower)) {
      return true;
    }
    
    // 「県」「都」「府」を省略した場合の判定
    if (prefLower.endsWith('県')) {
      const prefWithoutSuffix = prefLower.replace('県', '');
      if (inputLower === prefWithoutSuffix) {
        return true;
      }
    } else if (prefLower.endsWith('都')) {
      const prefWithoutSuffix = prefLower.replace('都', '');
      if (inputLower === prefWithoutSuffix) {
        return true;
      }
    } else if (prefLower.endsWith('府')) {
      const prefWithoutSuffix = prefLower.replace('府', '');
      if (inputLower === prefWithoutSuffix) {
        return true;
      }
    }
    
    return false;
  });
};

// エリアマッチング用ヘルパー関数
export const isAreaMatch = (itemArea, selectedArea) => {
  if (!itemArea || !selectedArea) return false;
  
  const itemAreaLower = itemArea.toLowerCase();
  const selectedLower = selectedArea.toLowerCase();
  
  // 完全一致
  if (itemAreaLower.includes(selectedLower)) {
    return true;
  }
  
  // 「県」「都」「府」を省略した場合の判定
  return PREFECTURES.some(pref => {
    const prefLower = pref.toLowerCase();
    if (prefLower.includes(selectedLower)) {
      if (prefLower.endsWith('県')) {
        const prefWithoutSuffix = prefLower.replace('県', '');
        if (selectedLower === prefWithoutSuffix && itemAreaLower.includes(prefLower)) {
          return true;
        }
      } else if (prefLower.endsWith('都')) {
        const prefWithoutSuffix = prefLower.replace('都', '');
        if (selectedLower === prefWithoutSuffix && itemAreaLower.includes(prefLower)) {
          return true;
        }
      } else if (prefLower.endsWith('府')) {
        const prefWithoutSuffix = prefLower.replace('府', '');
        if (selectedLower === prefWithoutSuffix && itemAreaLower.includes(prefLower)) {
          return true;
        }
      }
    }
    return false;
  });
};
