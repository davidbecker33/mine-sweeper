

/*
 *  Adds classes conditionally based on object literal key(class)/value(condition)
 */
export function rjsClass(obj) {

    let rClasses = [];
    for(let o in obj) {
       if(eval(obj[o])) {
         rClasses.push(o);

       }
    }
    return rClasses.join(" ");
}


