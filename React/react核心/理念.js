/*
 * @Author: zxh
 * @Date: 2021-06-01 15:15:50
 * @LastEditTime: 2021-06-07 15:57:00
 * @LastEditors: zxh
 * @Description:
 */

//此文学习来源于卡颂的React技术揭秘文章：https://react.iamkasong.com/


//react 15架构
/*
react 15架构：
    React15架构可以分为两层：
        ·Reconciler（协调器）—— 负责找出变化的组件
        ·Renderer（渲染器）—— 负责将变化的组件渲染到页面上


    每当有更新发生时，Reconciler会做如下工作：
        调用函数组件、或class组件的render方法，将返回的JSX转化为虚拟DOM
        将虚拟DOM和上次更新时的虚拟DOM对比
        通过对比找出本次更新中变化的虚拟DOM
        通知Renderer将变化的虚拟DOM渲染到页面上


    Renderer（渲染器）
        由于React支持跨平台，所以不同平台有不同的Renderer。我们前端最熟悉的是负责在浏览器环境渲染的Renderer —— ReactDOM (opens new window)。

    除此之外，还有：
        ReactNative (opens new window)渲染器，渲染App原生组件
        ReactTest (opens new window)渲染器，渲染出纯Js对象用于测试
        ReactArt (opens new window)渲染器，渲染到Canvas, SVG 或 VML (IE8)
        在每次更新发生时，Renderer接到Reconciler通知，将变化的组件渲染在当前宿主环境。

    React15架构的缺点
        在Reconciler中，mount的组件会调用mountComponent (opens new window)，update的组件会调用updateComponent (opens new window)。这两个方法都会递归更新子组件。
        由于递归执行，所以更新一旦开始，中途就无法中断。当层级很深时，递归更新时间超过了16ms，用户交互就会卡顿。

*/



// react 16架构：
/*
react 16架构：
    React16架构可以分为三层：
        ·Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入Reconciler
        ·Reconciler（协调器）—— 负责找出变化的组件
        ·Renderer（渲染器）—— 负责将变化的组件渲染到页面上

    可以看到，相较于React15，React16中新增了Scheduler（调度器），让我们来了解下他。


    *Scheduler（调度器）
        既然我们以浏览器是否有剩余时间作为任务中断的标准，那么我们需要一种机制，当浏览器有剩余时间时通知我们。
        其实部分浏览器已经实现了这个API，这就是requestIdleCallback (opens new window)。但是由于以下因素，React放弃使用：
        浏览器兼容性
        触发频率不稳定，受很多因素影响。比如当我们的浏览器切换tab后，之前tab注册的requestIdleCallback触发的频率会变得很低
        基于以上原因，React实现了功能更完备的requestIdleCallbackpolyfill，这就是Scheduler。除了在空闲时触发回调的功能外，Scheduler还提供了多种调度优先级供任务设置。


    *Reconciler（协调器）
        我们知道，在React15中Reconciler是递归处理虚拟DOM的。让我们看看React16的Reconciler (opens new window)。
        我们可以看见，更新工作从递归变成了可以中断的循环过程。每次循环都会调用shouldYield判断当前是否有剩余时间。

        为避免更新时渲染不完全问题，react16 在内存中完成所有组件的更新操作，然后再统一交给Renderer


    *Renderer（渲染器）
        Renderer根据Reconciler为虚拟DOM打的标记，同步执行对应的DOM操作。


*/


//代数效应（Algebraic Effects）
/*
    简单来说（个人理解）  代数效应就是可以在发生错误的时候 返回正确的（想要的）值的一个容错方法

    代数效应在react中的应用：hooks
        对于类似useState、useReducer、useRef这样的Hook，我们不需要关注FunctionComponent的state在Hook中是如何保存的，React会为我们处理。
        我们只需要假设useState返回的是我们想要的state，并编写业务逻辑就行。







*/


// Fiber
/*
    Fiber是什么
        Fiber并不是计算机术语中的新名词，他的中文翻译叫做纤程，与进程（Process）、线程（Thread）、协程（Coroutine）同为程序执行过程。
        在很多文章中将纤程理解为协程的一种实现。在JS中，协程的实现便是Generator。
        所以，我们可以将纤程(Fiber)、协程(Generator)理解为代数效应思想在JS中的体现。
        React Fiber可以理解为：
        React内部实现的一套状态更新机制。支持任务不同优先级，可中断与恢复，并且恢复后可以复用之前的中间状态。
        其中每个任务更新单元为React Element对应的Fiber节点。

    Fiber包含三层含义：
        作为架构来说，之前React15的Reconciler采用递归的方式执行，数据保存在递归调用栈中，所以被称为stack Reconciler。React16的Reconciler基于Fiber节点实现，被称为Fiber Reconciler。
        作为静态的数据结构来说，每个Fiber节点对应一个React element，保存了该组件的类型（函数组件/类组件/原生组件...）、对应的DOM节点等信息。
        作为动态的工作单元来说，每个Fiber节点保存了本次更新中该组件改变的状态、要执行的工作（需要被删除/被插入页面中/被更新...）


    fiber可以构建fiber节点对应DOM节点，多个fiber节点组成fiber树，对应页面的DOM树。
    当每次更新的时候，我们会更新fiber树，但是如果当要更新的量很大的时候，我们在更新树时可能会出现卡顿等问题，（自己想嘛，一个大量数据在遍历的时候能不照成卡顿么。）
    所以fiber采用了双fiber树的操作，也就是“双缓存”。一个是currentFiber用于显示，一个是workInProgressFiber用于更新操作。
    当workInProgressFiber更新完成后，react应用的根节点通过current指针切换，指向到当前的workInProgressFiber，当前workInProgressFiber就变成了currentFiber；










*/
















