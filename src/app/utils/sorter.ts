export default async function (sort: string | undefined) {
  let sortResult: any = {};

  if (sort)
    if (sort.includes("-")) {
      let data: string = sort.split("-")[sort.split("-").length - 1];
      sortResult[data] = -1;
    } else {
      sortResult[sort] = 1;
    }

  return sortResult;
}

// export default async function<T extends object>(sort: string | undefined): Promise<T> {
//   if(!sort) return {} as T

//   if(sort.includes('-')) {
//     let d: string = sort.split('-')[sort.split('-').length-1]
//     return { [d]: -1 } as T
//   }

//   return { [sort]: 1 } as T
// }
