package br.com.joyfliper;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.InputAdapter;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.utils.ScreenUtils;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.math.Vector3;

public final class ClawScreen implements Screen {
    private static final float W=360, H=640;
    private final OrthographicCamera camera = new OrthographicCamera();
    private final ShapeRenderer shapes = new ShapeRenderer();
    private final SpriteBatch batch = new SpriteBatch();
    private final BitmapFont font = new BitmapFont();
    private final Vector3 touch = new Vector3();
    private final float[] px={96,163,231,120,207,273}, py={242,252,245,193,195,201};
    private final Color[] toys={
        c("F5B6C8"),c("C8B5EE"),c("A8DCCB"),c("F6D7A7"),c("B6D6F4"),c("E8B6C9")
    };
    private final boolean[] won = new boolean[6];
    private float clawX=180, clawY=465, timer=0, sparkle=0;
    private int state=0, selected=-1, score=0, tries=0;
    private float stateTime=0;
    private boolean left,right;
    private static Color c(String hex){return Color.valueOf(hex);}
    private void color(String hex){shapes.setColor(c(hex));}
    private void rect(float x,float y,float w,float h,String hex){color(hex);shapes.rect(x,y,w,h);}
    private void circle(float x,float y,float r,String hex){color(hex);shapes.circle(x,y,r,32);}
    private void line(float x,float y,float xx,float yy,String hex){color(hex);shapes.rectLine(x,y,xx,yy,3);}
    @Override public void show(){
        camera.setToOrtho(false,W,H);
        font.getData().setScale(1.15f);
        Gdx.input.setInputProcessor(new InputAdapter(){
            @Override public boolean touchDown(int x,int y,int pointer,int button){
                camera.unproject(touch.set(x,y,0));
                if(touch.y<125 && state==0){
                    if(touch.x<115)left=true;
                    else if(touch.x>245)right=true;
                    else drop();
                } else if(touch.y<125 && state==4){reset();}
                return true;
            }
            @Override public boolean touchUp(int x,int y,int pointer,int button){left=false;right=false;return true;}
        });
    }
    private void drop(){state=1;stateTime=0;tries++;selected=-1;}
    private void reset(){state=0;stateTime=0;sparkle=0;}
    private void update(float dt){
        dt=Math.min(dt,0.05f);timer+=dt;stateTime+=dt;
        if(state==0){
            if(left)clawX-=125*dt;
            if(right)clawX+=125*dt;
            clawX=MathUtils.clamp(clawX,83,277);
        }else if(state==1){
            clawY=Math.max(217,clawY-190*dt);
            if(clawY<=217){
                float best=42;
                for(int i=0;i<px.length;i++){
                    float d=Math.abs(px[i]-clawX);
                    if(!won[i]&&d<best){best=d;selected=i;}
                }
                state=2;stateTime=0;
            }
        }else if(state==2){
            if(stateTime>.48f){state=3;stateTime=0;}
        }else if(state==3){
            clawY=Math.min(465,clawY+155*dt);
            if(clawY>=465){
                if(selected>=0){won[selected]=true;score+=10;sparkle=1.6f;}
                state=4;stateTime=0;
            }
        }
        if(sparkle>0)sparkle-=dt;
    }
    private void toy(float x,float y,Color base,float phase){
        float bob=MathUtils.sin(timer*2+phase)*2;
        shapes.setColor(base);
        shapes.circle(x,y+10+bob,22,32);
        shapes.circle(x-15,y+28+bob,10,24);
        shapes.circle(x+15,y+28+bob,10,24);
        circle(x-8,y+14+bob,2.5f,"55485C");
        circle(x+8,y+14+bob,2.5f,"55485C");
        circle(x,y+7+bob,3,"E38F9C");
        circle(x-12,y+4+bob,5,"F9D6D8");
        circle(x+12,y+4+bob,5,"F9D6D8");
    }
    @Override public void render(float delta){
        update(delta);
        ScreenUtils.clear(c("F8F2FA"));
        camera.update();
        shapes.setProjectionMatrix(camera.combined);
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        rect(0,0,W,640,"F8F2FA");
        rect(0,570,W,70,"EDE1F2");
        circle(31,607,11,"F1B7C8");circle(331,601,8,"B9DDCD");
        rect(48,154,264,390,"CBA6D6");
        rect(58,165,244,365,"F1DCEC");
        rect(68,229,224,275,"E6F3F2");
        rect(68,229,224,28,"C7DAD8");
        rect(68,155,224,67,"E2C2DD");
        for(int i=0;i<px.length;i++)if(!won[i])toy(px[i],py[i],toys[i],i);
        rect(77,510,206,13,"A782B6");
        rect(80,clawY+24,200,3,"B6A0C3");
        line(clawX,510,clawX,clawY+12,"8F789E");
        circle(clawX,clawY+7,12,"8F789E");
        line(clawX-8,clawY,clawX-19,clawY-19,"8F789E");
        line(clawX+8,clawY,clawX+19,clawY-19,"8F789E");
        line(clawX-19,clawY-19,clawX-12,clawY-29,"8F789E");
        line(clawX+19,clawY-19,clawX+12,clawY-29,"8F789E");
        if(selected>=0&&(state==2||state==3))toy(clawX,clawY-47,toys[selected],selected);
        rect(111,170,138,40,"9575A5");
        rect(120,178,120,25,"4D405A");
        rect(25,38,92,76,"D9C5E4");
        rect(243,38,92,76,"D9C5E4");
        rect(128,38,104,76,state==0?"F3B7C6":"D9D1DE");
        if(sparkle>0)for(int i=0;i<14;i++){
            float angle=i*6.28318f/14f+timer;
            float radius=(1.6f-sparkle)*95;
            circle(180+MathUtils.cos(angle)*radius,365+MathUtils.sin(angle)*radius,3+(i%3),"F8C970");
        }
        shapes.end();
        batch.setProjectionMatrix(camera.combined);
        batch.begin();
        font.setColor(c("5D4B67"));
        font.getData().setScale(1.7f);
        font.draw(batch,"JOY CLAW",99,596);
        font.getData().setScale(1.03f);
        font.draw(batch,"Pontos: "+score+"    Tentativas: "+tries,70,556);
        font.draw(batch,"PREMIOS",153,192);
        font.getData().setScale(1.55f);
        font.draw(batch,"<",62,88);
        font.draw(batch,">",282,88);
        font.getData().setScale(1.03f);
        font.draw(batch,state==0?"PEGAR":state==4?"NOVAMENTE":"...",151,79);
        if(state==4){
            font.getData().setScale(1.12f);
            font.draw(batch,selected>=0?"Voce ganhou um bichinho!":"Quase! Tente outra vez.",82,136);
        }else if(state==0)font.draw(batch,"Mova a garra e toque em PEGAR",69,136);
        batch.end();
    }
    @Override public void resize(int width,int height){
        float aspect=(float)width/Math.max(1,height);
        camera.setToOrtho(false,W,Math.max(H,W/aspect));
        camera.position.set(W/2,H/2,0);
        camera.update();
    }
    @Override public void pause(){} @Override public void resume(){}
    @Override public void hide(){Gdx.input.setInputProcessor(null);}
    @Override public void dispose(){shapes.dispose();batch.dispose();font.dispose();}
}
