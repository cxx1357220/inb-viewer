
class CDP {
  constructor(win, top = 0) {
    this.win = win
    this.top = top
    this.dbg = win.webContents.debugger
    this.isAttached = false
    // Three场景专用最小延时，可自行调整 3~10
    this.tinyDelay = 3
  }

  // 连接CDP调试通道
  async attach() {
    if (this.isAttached) return
    this.dbg.attach()
    this.isAttached = true
  }

  // 释放调试器、清理缓存（防内存泄漏）
  async release() {
    if (!this.isAttached) return
    try {
      // 清空浏览器缓存Cookie
      await this.dbg.sendCommand('Network.clearBrowserCache')
      await this.dbg.sendCommand('Network.clearBrowserCookies')
      // 断开CDP长连接
      await this.dbg.detach()
    } catch (e) {
      console.log('e: ', e);
      // 窗口已销毁直接忽略报错
    }
    this.isAttached = false
  }

  // 延时工具
  sleep(ms) {
    return new Promise(res => setTimeout(res, ms))
  }
  send(eventName, event) {
    switch (eventName) {
      case 'mousedown':
        this.dbg.sendCommand('Input.dispatchMouseEvent', {
          type: 'mousePressed',
          x: event.x,
          y: event.y - this.top,
          button: 'left',
          buttons: 1,
          clickCount: 1
        })

        break;
      case 'mouseup':
        this.dbg.sendCommand('Input.dispatchMouseEvent', {
          type: 'mouseReleased',
          x: event.x,
          y: event.y - this.top,
          button: 'left',
          buttons: 0,
          clickCount: 1
        })
        break;
      case 'mousemove':
        this.dbg.sendCommand('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: event.x,
          y: event.y - this.top,
          buttons: 1
        })
        break;
      case 'keydown':
        this.dbg.sendCommand('Input.dispatchKeyEvent', {
          type: 'keyDown',
          key: event.keyName,
          // code: event.keyName,
        })
        break;
      case 'keyup':
        this.dbg.sendCommand('Input.dispatchKeyEvent', {
          type: 'keyUp',
          key: event.keyName,
          // code: event.keyName,
        })
        break;
      // case 'input':
      //   console.log('input event: ', event);

      //   this.dbg.sendCommand('Input.dispatchKeyEvent', {
      //     type: 'char',
      //     text: '',
      //     // text: event.keyName,
      //   })
      //   break;
      case 'wheel':
        let deltaX = 0, deltaY = 0
        if (event.direction == 4) {
          deltaX = event.rotation
        } else {
          deltaY = event.rotation
        }
        this.dbg.sendCommand('Input.dispatchMouseEvent', {
          type: 'mouseWheel',
          x: event.x,
          y: event.y - this.top,
          deltaX,
          deltaY,
          deltaMode: 0
        })
        break;

      default:
        break;
    }
  }





  // 3. 鼠标滚轮单次滚动
  async wheel(x, y, deltaY = 100, deltaX = 0) {
    await this.dbg.sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x,
      y,
      deltaX,
      deltaY,
      deltaMode: 0
    })
  }



  // 4. 键盘输入文本（支持中文、大小写）
  async typeText(text) {
    for (const char of text) {
      await this.dbg.sendCommand('Input.dispatchKeyEvent', {
        type: 'char',
        text: char
      })
    }
  }

  // 5. 单功能按键：Enter / Backspace / Tab / ArrowDown 等
  async keyPress(keyName) {
    await this.dbg.sendCommand('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: keyName
    })
    await this.sleep(this.tinyDelay)
    await this.dbg.sendCommand('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: keyName
    })
  }

  // 6. 组合键 Ctrl+A / Ctrl+C / Ctrl+V
  async keyCombo(ctrl = false, shift = false, alt = false, meta = false, key, code) {
    let modifiers = 0
    if (ctrl) modifiers += 2
    if (shift) modifiers += 1
    if (alt) modifiers += 4
    if (meta) modifiers += 8

    // 按下修饰键
    if (ctrl) await this.dbg.sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Control', modifiers })
    if (shift) await this.dbg.sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Shift', modifiers })
    if (alt) await this.dbg.sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Alt', modifiers })
    if (meta) await this.dbg.sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Meta', modifiers })

    await this.sleep(this.tinyDelay)
    // 按下目标按键
    await this.dbg.sendCommand('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code,
      modifiers
    })
    await this.sleep(this.tinyDelay)
    await this.dbg.sendCommand('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code,
      modifiers
    })
    await this.sleep(this.tinyDelay)

    // 释放修饰键
    if (ctrl) await this.dbg.sendCommand('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Control' })
    if (shift) await this.dbg.sendCommand('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Shift' })
    if (alt) await this.dbg.sendCommand('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Alt' })
    if (meta) await this.dbg.sendCommand('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Meta' })
  }
}

export { CDP }