import React from 'react';
import {motion} from 'framer-motion';
import {useRestaurant} from '../context/RestaurantContext';

const AllergyFilter=()=> {
  const {mandatoryAllergies,recommendedAllergies,selectedAllergies,setSelectedAllergies}=useRestaurant();

  const toggleAllergy=(allergyId)=> {
    setSelectedAllergies(prev=> 
      prev.includes(allergyId) 
        ? prev.filter(id=> id !==allergyId)
        : [...prev,allergyId]
    );
  };

  const clearAll=()=> {
    setSelectedAllergies([]);
  };

  const AllergyButton=({allergy,index})=> (
    <motion.button
      key={allergy.id}
      initial={{opacity: 0,scale: 0.8}}
      animate={{opacity: 1,scale: 1}}
      transition={{duration: 0.3,delay: index * 0.05}}
      onClick={()=> toggleAllergy(allergy.id)}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-full border-2 transition-all duration-200
        ${selectedAllergies.includes(allergy.id)
          ? 'bg-red-500 border-red-500 text-white shadow-lg scale-105'
          : 'bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
        }
      `}
    >
      <span className="text-lg">{allergy.icon}</span>
      <span className="font-medium">{allergy.name}</span>
    </motion.button>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* 法定8品目 */}
      <div className="mb-8">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            表示義務のある8品目（特定原材料）
          </h3>
          <p className="text-sm text-gray-600">
            食品表示法により表示が義務付けられているアレルギー物質
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {mandatoryAllergies.map((allergy,index)=> (
            <AllergyButton key={allergy.id} allergy={allergy} index={index} />
          ))}
        </div>
      </div>

      {/* 推奨20品目 */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            表示が推奨される20品目（特定原材料に準ずるもの）
          </h3>
          <p className="text-sm text-gray-600">
            可能な限り表示することが推奨されているアレルギー物質
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {recommendedAllergies.map((allergy,index)=> (
            <AllergyButton key={allergy.id} allergy={allergy} index={index + mandatoryAllergies.length} />
          ))}
        </div>
      </div>

      {/* 選択状況表示 */}
      {selectedAllergies.length > 0 && (
        <motion.div
          initial={{opacity: 0,y: 10}}
          animate={{opacity: 1,y: 0}}
          className="text-center"
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 mb-2">
              <strong>{selectedAllergies.length}個のアレルギー</strong>が選択されています
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {selectedAllergies.map(allergyId=> {
                const allergy=[...mandatoryAllergies,...recommendedAllergies].find(a=> a.id===allergyId);
                return (
                  <span
                    key={allergyId}
                    className="bg-red-200 text-red-800 px-2 py-1 rounded text-sm"
                  >
                    {allergy?.icon} {allergy?.name}
                  </span>
                );
              })}
            </div>
            <button
              onClick={clearAll}
              className="text-red-600 hover:text-red-800 text-sm font-medium underline"
            >
              すべてクリア
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AllergyFilter;