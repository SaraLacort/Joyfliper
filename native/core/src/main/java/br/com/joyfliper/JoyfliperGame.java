package br.com.joyfliper;

import com.badlogic.gdx.Game;

public final class JoyfliperGame extends Game {
    @Override public void create() {
        setScreen(new ClawScreen());
    }
}
