// LFUCache cache = new LFUCache(2); // קיבולת 2

import { date } from "zod";

// cache.put(1, 1);
// cache.put(2, 2);
// cache.get(1);       // מחזיר 1
// cache.put(3, 3);    // מסיר key=2 כי תדירות הגישה שלו הכי נמוכה
// cache.get(2);       // מחזיר -1 (לא נמצא)
// cache.get(3);       // מחזיר 3
// cache.put(4, 4);    // מסיר key=1
// cache.get(1);       // מחזיר -1 (לא נמצא)
// cache.get(3);       // מחזיר 3
// cache.get(4);       // מחזיר 4


const cache = (maxVolume) => {
    this.maxVolume = maxVolume;
    this.cache = {};
    this.LRU = {};

    this.head = null;
    this.tail = null;
    this.LRU = {};
    
    
    const get=(key)=>{
        if (this.cache[key]) {
        if (this.head === null) {
            this.head = key;
            this.tail = key;
            this.LRU={{[key]: Date.now()}};
        }

            this.cache[key].frequency = this.cache[key].frequency  + 1;

            this.time[this.cache[key].frequency][key] = Date.now();
            return this.cache[key].value;
        } else {
            return -1;
        }
    }
    
    const Put = (key, value)=>{
        if (this.cache[key]) {
            this.cache[key].value = value;
            delete this.time[this.cache[key].frequency][key];
            this.cache[key].frequency = this.cache[key].frequency + 1;
            this.time[this.cache[key].frequency][key] = Date.now();
        } else {
            if (Object.keys(this.cache).length >= 2) {
                let i = 1;
                let minTime = Date.now();
                let keyToDelete = null;
                while (i != -1){
                    if (this.time[i] && Object.keys(this.time[i]).length > 0) {                        
                        this.time[i].array.forEach(element => {
                            if (this.time[i][element] < minTime) {
                                minTime = this.time[i][element];
                                keyToDelete = element;
                            }
                        });
                    i=-1;
                    } else {i++;
                      
                    }
                }
                delete this.cache[keyToDelete];}    
                delete this.time[this.cache[keyToDelete].frequency][keyToDelete];
              

        
                this.cache[key] = { value: value, frequency: 1, updateAt: Date.now() };
                this.time[1][key] = Date.now();
        }
        }
    
    }
