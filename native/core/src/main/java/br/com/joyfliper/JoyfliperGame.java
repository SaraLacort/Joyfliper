package br.com.joyfliper;

import com.badlogic.gdx.Game;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.utils.ScreenUtils;
import com.badlogic.gdx.Screen;

public final class JoyfliperGame extends Game {
    @Override public void create() { setScreen(new WelcomeScreen()); }
    private static final class WelcomeScreen implements Screen {
        private SpriteBatch batch;
        private BitmapFont font;
        @Override public void show() { batch = new SpriteBatch(); font = new BitmapFont(); font.getData().setScale(2f); }
        @Override public void render(float delta) {
            ScreenUtils.clear(0.97f, 0.94f, 0.98f, 1f);
            batch.begin();
            font.setColor(0.35f, 0.28f, 0.40f, 1f);
            font.draw(batch, "Joyfliper", 32, Gdx.graphics.getHeight() * 0.7f);
            font.getData().setScale(1f);
            font.draw(batch, "Nova base libGDX - em desenvolvimento", 32, Gdx.graphics.getHeight() * 0.6f);
            batch.end();
        }
        @Override public void resize(int width, int height) { batch.getProjectionMatrix().setToOrtho2D(0,0,width,height); }
        @Override public void pause() {} @Override public void resume() {} @Override public void hide() {}
        @Override public void dispose() { batch.dispose(); font.dispose(); }
    }
}
