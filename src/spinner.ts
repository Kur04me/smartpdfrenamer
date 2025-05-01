export class Spinner {
    private spin_char = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    private timer: NodeJS.Timeout | null = null

    start(message: string) {
        process.stdout.write('\x1B[?25l') //カーソルを消す
        let spin_count = 0;
        this.timer = setInterval(() => {
            process.stdout.cursorTo(0) // カーソルを先頭に移動
            process.stdout.write(`${this.spin_char[spin_count]} ${message}`) //spin_charの配列で描画
            spin_count++;
            spin_count >= this.spin_char.length ? spin_count = 0 : null //要素番号のリセット
        }, 100)
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
            process.stdout.cursorTo(0) // カーソルを先頭に移動
            process.stdout.clearLine(0) // 行をクリア
            process.stdout.write('\x1B[?25h') //カーソルを戻す
        }
    }
}