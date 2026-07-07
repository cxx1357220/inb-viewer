
class Control {
    constructor(dom,id) {
        // console.log('dom: ', dom);
        this.dom = dom
        this.id = id
        this.init()
        this.listeners = []
        this.panning = false
        this.drag = {}
    }
    addListeners(func) {
        this.listeners.push(func)
    }
    // 骗自己，dom.addEventListener还是存在的，有空再拆分出来搞掉
    removeListeners() {
        this.listeners = []
    }
    onWheel(e) {
        e.preventDefault();
        e.stopPropagation();




        if (e.ctrlKey) {
            // if (e.deltaY > 0) return console.log('向内');
            // if (e.deltaY < 0) return console.log('向外');
            // if(e.target  == this.dom){
            //     this.listeners.forEach(f=>f('zoom',[e.deltaY,e.clientX - this.dom.offsetLeft, e.clientY - this.dom.offsetTop]))

            // }else{
            //     this.listeners.forEach(f=>f('zoom',[e.deltaY,e.clientX - this.dom.offsetLeft, e.clientY - this.dom.offsetTop]))

            // }
            if (e.target == this.dom) {
                this.listeners.forEach(f => {
                    f('zoom', [e.deltaY, e.offsetX, e.offsetY],this.id)
                })
            } else {
                let bounds = e.target.getBoundingClientRect();
                let bounds2 = this.dom.getBoundingClientRect();
                let x = e.offsetX - bounds2.x + bounds.x
                let y = e.offsetY - bounds2.y + bounds.y

                this.listeners.forEach(f => {
                    f('zoom', [e.deltaY, x, y],this.id)
                })
            }
            // this.listeners.forEach(f=>f('zoom',[e.deltaY,e.clientX - this.dom.offsetLeft, e.clientY - this.dom.offsetTop]))
            // console.log('this.dom.offsetTop: ', this.dom.offsetTop,this.dom.offsetLeft);
        } else {
            // if (Math.abs(e.deltaX) !== 0 && Math.abs(e.deltaY) !== 0) return console.log('没有固定方向');
            // if (e.deltaY > 0) return console.log('向上');
            // if (e.deltaY < 0) return console.log('向下');
            // if (e.deltaX < 0) return console.log('向右');
            // if (e.deltaX > 0) return console.log('向左');
            this.listeners.forEach(f => {
                f('move', ['wheel', e.deltaX, e.deltaY],this.id)
            })

        }
    }
    init() {
        this.dom.addEventListener('wheel', (e) => (this.onWheel(e)));

        this.dom.addEventListener('mousedown', (e) => {

            //     console.log('bounds: ', bounds);
            //     console.log('e: ', e);
            //     console.log('e.clientX,e.clientY: ', e.clientX,e.clientY);
            //     console.log(e.clientX , this.dom.offsetLeft, e.clientY , this.dom.offsetTop);

            this.panning = true;
            this.drag = {
                x: e.clientX,
                y: e.clientY
            }

            if (e.target == this.dom) {
                this.listeners.forEach(f => {
                    f('click', ['mouse', e.offsetX, e.offsetY],this.id)
                })
            } else {
                let bounds = e.target.getBoundingClientRect();
                let bounds2 = this.dom.getBoundingClientRect();
                let x = e.offsetX - bounds2.x + bounds.x
                let y = e.offsetY - bounds2.y + bounds.y

                this.listeners.forEach(f => {
                    f('click', ['mouse', x, y],this.id)
                })
            }

        });

        this.dom.addEventListener('mousemove', (e) => {
            if (this.panning) {
                let x = -e.clientX + this.drag.x, y = -e.clientY + this.drag.y
                this.drag = {
                    x: e.clientX,
                    y: e.clientY
                }
                this.listeners.forEach(f => {
                    f('move', ['mouse', x, y],this.id)
                })
            }

            var x = e.clientX - this.dom.getBoundingClientRect().left;
            var y = e.clientY - this.dom.getBoundingClientRect().top;

            this.listeners.forEach(f => {
                f('mouse', ['move', x, y],this.id)
            })

            // this.panning = true;
        });
        this.dom.addEventListener('mouseup', (e) => {
            // console.log('e: ', e);
            this.panning = false;
            // this.panning = true;
        });

        this.dom.addEventListener('mouseleave', (e) => {
            this.listeners.forEach(f => {
                f('mouse', ['out'],this.id)
            })
        });
        this.dom.addEventListener('mouseenter', (e) => {
            this.listeners.forEach(f => {
                f('mouse', ['enter'],this.id)
            })
        });

    }


}
export default Control