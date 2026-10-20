// Topological endpoints keep their original radius when they also transfer.
export function traStationSymbol(node,station,externalTransfers=[]){
  const terminal=node.degree===1;
  const interchange=node.degree>2||(station?.lines.length||0)>1||externalTransfers.length>0;
  return {terminal,interchange,radius:terminal?10:interchange?9:7};
}
