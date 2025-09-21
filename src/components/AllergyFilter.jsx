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
        flex items-center justify-center space-x-1 px-2 py-1 rounded text-sm transition-all duration-200 w-full
        ${selectedAllergies.includes(allergy.id)
          ? 'bg-red-200 text-red-800'
          : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700'
        }
      `}
    >
      <span className="text-sm">{allergy.icon}</span>
      <span className="text-sm">{allergy.name}</span>
    </motion.button>
  );

  return (
    <div className="space-y-2">
      {/* 法定8品目 */}
      <div>
        <h3 className="text-xs font-semibold text-gray-900 mb-1">
          特定原材料（8品目）
        </h3>
        <div className="grid grid-cols-4 gap-1">
          {mandatoryAllergies.map((allergy,index)=> (
            <AllergyButton key={allergy.id} allergy={allergy} index={index} />
          ))}
        </div>
      </div>

      {/* 推奨20品目 */}
      <div>
        <h3 className="text-xs font-semibold text-gray-900 mb-1">
          特定原材料に準ずるもの（20品目）
        </h3>
        <div className="grid grid-cols-4 gap-1">
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
        >
          <div className="bg-red-50 border border-red-200 rounded p-1.5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-red-800 text-xs">
                <strong>{selectedAllergies.length}個選択中</strong>
              </p>
              <button
                onClick={clearAll}
                className="text-red-600 hover:text-red-800 text-xs underline"
              >
                クリア
              </button>
            </div>
            <div className="flex flex-wrap gap-0.5">
              {selectedAllergies.map(allergyId=> {
                const allergy=[...mandatoryAllergies,...recommendedAllergies].find(a=> a.id===allergyId);
                return (
                  <span
                    key={allergyId}
                    className="bg-red-200 text-red-800 px-1.5 py-0.5 rounded text-xs"
                  >
                    {allergy?.icon} {allergy?.name}
                  </span>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AllergyFilter;