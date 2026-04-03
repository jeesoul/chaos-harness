@echo off
echo ========================================================
echo   Chaos Harness Diagnostic
echo ========================================================
echo.

node -e "const fs=require('fs'),p=require('path'),h=process.env.USERPROFILE;console.log('=== [1] installed_plugins.json ===');const f1=p.join(h,'.claude','plugins','installed_plugins.json');if(fs.existsSync(f1)){const d=JSON.parse(fs.readFileSync(f1,'utf8').replace(/^\uFEFF/,''));const e=d.plugins&&d.plugins['chaos-harness@chaos-harness'];if(e){console.log('Found entry:');console.log(JSON.stringify(e,null,2));console.log('installPath has '+((e[0].installPath.match(/\\\\\\\\/g)||[]).length)+' double-backslashes');}else{console.log('ERROR: chaos-harness entry NOT found');}}else{console.log('ERROR: file not found');}"

echo.
node -e "const fs=require('fs'),p=require('path'),h=process.env.USERPROFILE;console.log('=== [2] settings.json ===');const f2=p.join(h,'.claude','settings.json');if(fs.existsSync(f2)){const d=JSON.parse(fs.readFileSync(f2,'utf8').replace(/^\uFEFF/,''));console.log('enabledPlugins.chaos-harness:',d.enabledPlugins&&d.enabledPlugins['chaos-harness@chaos-harness']);}else{console.log('ERROR: file not found');}"

echo.
node -e "const fs=require('fs'),p=require('path'),h=process.env.USERPROFILE;console.log('=== [3] Cache directory ===');const c=p.join(h,'.claude','plugins','cache','chaos-harness','chaos-harness','1.0.0');console.log('Path:',c);console.log('Exists:',fs.existsSync(c));if(fs.existsSync(c)){const skills=fs.readdirSync(p.join(c,'skills')).filter(n=>!n.startsWith('.'));const cmds=fs.readdirSync(p.join(c,'commands')).filter(n=>!n.startsWith('.'));console.log('Skills:',skills.length);console.log('Commands:',cmds.length);console.log('Has SKILL.md:',fs.existsSync(p.join(c,'skills','overview','SKILL.md')));console.log('Has overview.md:',fs.existsSync(p.join(c,'commands','overview.md')));console.log('Has plugin.json:',fs.existsSync(p.join(c,'.claude-plugin','plugin.json')));}"

echo.
echo ========================================================
echo   Copy the output above and send it for analysis
echo ========================================================
pause