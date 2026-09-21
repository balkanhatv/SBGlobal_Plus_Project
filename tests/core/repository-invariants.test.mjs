import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root=fileURLToPath(new URL("../../",import.meta.url));
const read=path=>readFileSync(join(root,path),"utf8");
const manifest=()=>JSON.parse(read("State/PROJECT_MANIFEST.json"));

test("REPO-001: accepted immutable RawSource blobs and source registry agree",()=>{
  for(const [path,key,expected] of [
    ["RawSourceCorpus/Disorganized Data 1.md","s1_blob","a9f63a64448a347edd0f2b0c74094284ee953c1b"],
    ["RawSourceCorpus/Disorganized Data 2.md","s2_blob","91c461de5e0d171f71d0bb89cd039953a1f1ecfd"],
  ]){
    const data=readFileSync(join(root,path));
    const actual=createHash("sha1").update(`blob ${data.length}\0`).update(data).digest("hex");
    assert.equal(actual,expected,path);
    assert.equal(manifest().raw_source[key],expected,key);
    assert.ok(read("Registers/SOURCE_REGISTRY.md").includes(expected),"Source registry must retain accepted blob");
  }
});

function requirements(path,textColumn){
  const output=new Map();
  for(const line of read(path).split("\n")){
    if(!/^\| S[12](?:\.\d+)?-U\d+-R\d+ \|/.test(line)) continue;
    const cells=line.split(/(?<!\\)\|/);
    const id=cells[1].trim();
    assert.ok(!output.has(id),`Duplicate source ID ${id} in ${path}`);
    output.set(id,cells[textColumn].trim());
  }
  return output;
}

test("REPO-002: all 2962 source child IDs and requirement text survive owner routing",()=>{
  const source=requirements("Registers/TRACEABILITY_MATRIX_REQUIREMENTS.md",3);
  const routed=requirements("Registers/F5_END_TO_END_SOURCE_REQUIREMENT_TRACEABILITY.md",2);
  assert.equal(source.size,2962);
  assert.equal(routed.size,source.size);
  for(const [id,text] of source) assert.equal(routed.get(id),text,id);
});

test("REPO-003: nine equal Industry owners preserve all 41 MS traceability namespaces",()=>{
  const canonical=new Set(read("DetailedDesign/DD-26_CANONICAL_SURFACES_MS_IDENTIFIERS.md")
    .match(/\b(?:HLT|EDU|RTL|HSP|MFG|PSV|GOV|NGO|SFM)-[A-Z]{2,4}\b/g));
  assert.equal(canonical.size,41);
  const owners={HLT:"Healthcare",EDU:"Education",RTL:"Retail",HSP:"Hospitality",
    MFG:"Manufacturing",PSV:"ProfessionalServices",GOV:"Government",NGO:"NGO-Temple-Trust",SFM:"Security-Facility"};
  assert.equal(Object.keys(owners).length,9);
  const shared=[
    "DetailedDesign/DD-19_DETAILED_DESIGN_TRACEABILITY.md",
    "DetailedDesign/DD-21_MS_ACCEPTANCE_TEST_CONTRACTS.md",
    "DetailedDesign/DD-22_MS_WORKFLOW_TRANSITION_MATRICES.md",
    "database/verification/0099_all_industries.verify.sql",
  ];
  for(const [prefix,folder] of Object.entries(owners)){
    const ids=[...canonical].filter(id=>id.startsWith(prefix+"-"));
    assert.ok(ids.length>=2 && ids.length<=8,prefix);
    const owner=`DetailedDesign/Industries/${folder}/${prefix}-00_DETAILED_DESIGN.md`;
    for(const path of [owner,...shared]){
      const content=read(path);
      for(const id of ids) assert.ok(content.includes(id),`${path} is missing ${id}`);
    }
  }
});

test("REPO-004: canonical decision definitions remain unique and contiguous",()=>{
  for(const [path,prefix] of [
    ["Architecture/A-12_ARCHITECTURE_DECISIONS_CONSTRAINTS_DEPENDENCIES_TRADEOFFS.md","ADR"],
    ["DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md","DD"],
  ]){
    const ids=[...read(path).matchAll(new RegExp(`^## ${prefix}-(\\d+)\\b`,"gm"))]
      .map(match=>Number(match[1]));
    assert.ok(ids.length>0,path);
    assert.equal(new Set(ids).size,ids.length,`Duplicate ${prefix} definitions`);
    assert.deepEqual(ids.slice().sort((a,b)=>a-b),Array.from({length:ids.length},(_,i)=>i+1),path);
  }
});

test("REPO-005: database sequence and current manifest inventory match actual files",()=>{
  const migrations=readdirSync(join(root,"database/migrations")).filter(p=>p.endsWith(".sql")).sort();
  const verifications=readdirSync(join(root,"database/verification")).filter(p=>p.endsWith(".sql"));
  assert.ok(migrations.length>0 && verifications.length>0);
  assert.deepEqual(migrations.map(p=>Number(p.slice(0,4))),Array.from({length:migrations.length},(_,i)=>i+1));
  const db=manifest().development.database;
  assert.equal(db.migration_count,migrations.length);
  assert.equal(db.verification_file_count,verifications.length);
  assert.equal(db.migration_range,`0001-${String(migrations.length).padStart(4,"0")}`);
});

function markdownFiles(dir){
  return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(entry=>{
    const path=join(dir,entry.name);
    return entry.isDirectory()?markdownFiles(path):entry.name.endsWith(".md")?[path]:[];
  });
}
test("REPO-006: repository Markdown file links resolve",()=>{
  const files=["README_FOUNDATION.md","database/README.md",...
    ["Architecture","DetailedDesign","Development","Foundation","Governing","Registers","State","RawSourceCorpus"]
      .flatMap(markdownFiles)];
  for(const path of files){
    for(const match of read(path).matchAll(/\[[^\]\n]*\]\(([^)\n]+)\)/g)){
      const target=match[1].trim().split(' "')[0].replace(/^<|>$/g,"");
      if(/^[a-zA-Z][a-zA-Z+.-]*:/.test(target) || target.startsWith("#")) continue;
      const file=decodeURIComponent(target.split("#")[0]);
      if(file) assert.ok(existsSync(resolve(root,dirname(path),file)),`${path}: missing ${file}`);
    }
  }
});
