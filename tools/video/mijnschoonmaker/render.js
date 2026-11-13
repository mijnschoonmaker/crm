const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const [w,h,out,fps,only]=[+process.argv[2],+process.argv[3],process.argv[4],+(process.argv[5]||30),process.argv[6]];
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:w,height:h}});
await pg.goto('file://'+__dirname+'/film.html');await pg.waitForTimeout(800);
if(only){for(const t of only.split(',')){await pg.evaluate(t=>render(+t),t);await pg.screenshot({path:`${out}-${t}.jpg`,type:'jpeg',quality:80})}await b.close();return}
const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate',String(fps),'-i','-','-c:v','libx264','-preset','slow','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
const N=24*fps;for(let i=0;i<N;i++){await pg.evaluate(t=>render(t),i/fps);const buf=await pg.screenshot({type:'jpeg',quality:92});ff.stdin.write(buf)}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close()})();
