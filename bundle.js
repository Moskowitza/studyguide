
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    let running = false;
    function run_tasks() {
        tasks.forEach(task => {
            if (!task[0](now())) {
                tasks.delete(task);
                task[1]();
            }
        });
        running = tasks.size > 0;
        if (running)
            raf(run_tasks);
    }
    function loop(fn) {
        let task;
        if (!running) {
            running = true;
            raf(run_tasks);
        }
        return {
            promise: new Promise(fulfil => {
                tasks.add(task = [fn, fulfil]);
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function add_resize_listener(element, fn) {
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        const object = document.createElement('object');
        object.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
        object.type = 'text/html';
        object.tabIndex = -1;
        let win;
        object.onload = () => {
            win = object.contentDocument.defaultView;
            win.addEventListener('resize', fn);
        };
        if (/Trident/.test(navigator.userAgent)) {
            element.appendChild(object);
            object.data = 'about:blank';
        }
        else {
            object.data = 'about:blank';
            element.appendChild(object);
        }
        return {
            cancel: () => {
                win && win.removeEventListener && win.removeEventListener('resize', fn);
                element.removeChild(object);
            }
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = key && { [key]: value };
            const child_ctx = assign(assign({}, info.ctx), info.resolved);
            const block = type && (info.current = type)(child_ctx);
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                flush();
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = { [info.value]: promise };
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const score = writable(0);

    /* src/Question.svelte generated by Svelte v3.12.1 */

    const file = "src/Question.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.answer = list[i];
    	return child_ctx;
    }

    // (58:2) {#if isAnswered}
    function create_if_block_1(ctx) {
    	var if_block_anchor;

    	function select_block_type(changed, ctx) {
    		if (ctx.isCorrect) return create_if_block_2;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(null, ctx);
    	var if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type !== (current_block_type = select_block_type(changed, ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		d: function destroy(detaching) {
    			if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(58:2) {#if isAnswered}", ctx });
    	return block;
    }

    // (59:41) {:else}
    function create_else_block(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("WRONG!!!!");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(59:41) {:else}", ctx });
    	return block;
    }

    // (59:4) {#if isCorrect}
    function create_if_block_2(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("You got that one right");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2.name, type: "if", source: "(59:4) {#if isCorrect}", ctx });
    	return block;
    }

    // (63:2) {#each allAnswers as answer}
    function create_each_block(ctx) {
    	var button, raw_value = ctx.answer.answer + "", dispose;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "svelte-1erj4fi");
    			toggle_class(button, "isCorrect", ctx.answer.correct && ctx.isAnswered);
    			add_location(button, file, 63, 4, 1219);
    			dispose = listen_dev(button, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			button.innerHTML = raw_value;
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.allAnswers || changed.isAnswered)) {
    				toggle_class(button, "isCorrect", ctx.answer.correct && ctx.isAnswered);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(63:2) {#each allAnswers as answer}", ctx });
    	return block;
    }

    // (70:2) {#if isAnswered}
    function create_if_block(ctx) {
    	var div, button, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "next";
    			attr_dev(button, "class", "svelte-1erj4fi");
    			add_location(button, file, 71, 6, 1421);
    			add_location(div, file, 70, 4, 1409);
    			dispose = listen_dev(button, "click", ctx.nextQuestion);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(70:2) {#if isAnswered}", ctx });
    	return block;
    }

    function create_fragment(ctx) {
    	var h3, raw_value = ctx.question.question + "", t0, h5, h5_class_value, t1, div, t2;

    	var if_block0 = (ctx.isAnswered) && create_if_block_1(ctx);

    	let each_value = ctx.allAnswers;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	var if_block1 = (ctx.isAnswered) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = space();
    			h5 = element("h5");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block1) if_block1.c();
    			add_location(h3, file, 53, 0, 974);
    			attr_dev(h5, "class", h5_class_value = "" + null_to_empty((ctx.isCorrect ? 'correct' : 'wrong')) + " svelte-1erj4fi");
    			add_location(h5, file, 56, 0, 1013);
    			attr_dev(div, "class", "answer_continer svelte-1erj4fi");
    			add_location(div, file, 61, 0, 1154);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			h3.innerHTML = raw_value;
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h5, anchor);
    			if (if_block0) if_block0.m(h5, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t2);
    			if (if_block1) if_block1.m(div, null);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.question) && raw_value !== (raw_value = ctx.question.question + "")) {
    				h3.innerHTML = raw_value;
    			}

    			if (ctx.isAnswered) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(h5, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if ((changed.isCorrect) && h5_class_value !== (h5_class_value = "" + null_to_empty((ctx.isCorrect ? 'correct' : 'wrong')) + " svelte-1erj4fi")) {
    				attr_dev(h5, "class", h5_class_value);
    			}

    			if (changed.allAnswers || changed.isAnswered) {
    				each_value = ctx.allAnswers;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (ctx.isAnswered) {
    				if (!if_block1) {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h3);
    				detach_dev(t0);
    				detach_dev(h5);
    			}

    			if (if_block0) if_block0.d();

    			if (detaching) {
    				detach_dev(t1);
    				detach_dev(div);
    			}

    			destroy_each(each_blocks, detaching);

    			if (if_block1) if_block1.d();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function shuffle(array) {
      array.sort(() => Math.random() - 0.5);
    }

    function instance($$self, $$props, $$invalidate) {
    	let { question, nextQuestion } = $$props;
      let isCorrect;
      let isAnswered = false;
      let { count = 0 } = $$props;
      let correctAnswer = question.correct_answer;
      let answers = question.incorrect_answers.map(answer => {
        return {
          answer,
          correct: false
        };
      });
      let allAnswers = [...answers, { answer: correctAnswer, correct: true }];
      shuffle(allAnswers);
      function checkQuestion(ans) {
        $$invalidate('isAnswered', isAnswered = true);
        $$invalidate('isCorrect', isCorrect = ans);
        if (ans) {
          score.update(val => val + 1);
        }
        $$invalidate('count', count++, count);
      }

    	const writable_props = ['question', 'nextQuestion', 'count'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Question> was created with unknown prop '${key}'`);
    	});

    	const click_handler = ({ answer }) => checkQuestion(answer.correct);

    	$$self.$set = $$props => {
    		if ('question' in $$props) $$invalidate('question', question = $$props.question);
    		if ('nextQuestion' in $$props) $$invalidate('nextQuestion', nextQuestion = $$props.nextQuestion);
    		if ('count' in $$props) $$invalidate('count', count = $$props.count);
    	};

    	$$self.$capture_state = () => {
    		return { question, nextQuestion, isCorrect, isAnswered, count, correctAnswer, answers, allAnswers };
    	};

    	$$self.$inject_state = $$props => {
    		if ('question' in $$props) $$invalidate('question', question = $$props.question);
    		if ('nextQuestion' in $$props) $$invalidate('nextQuestion', nextQuestion = $$props.nextQuestion);
    		if ('isCorrect' in $$props) $$invalidate('isCorrect', isCorrect = $$props.isCorrect);
    		if ('isAnswered' in $$props) $$invalidate('isAnswered', isAnswered = $$props.isAnswered);
    		if ('count' in $$props) $$invalidate('count', count = $$props.count);
    		if ('correctAnswer' in $$props) correctAnswer = $$props.correctAnswer;
    		if ('answers' in $$props) answers = $$props.answers;
    		if ('allAnswers' in $$props) $$invalidate('allAnswers', allAnswers = $$props.allAnswers);
    	};

    	return {
    		question,
    		nextQuestion,
    		isCorrect,
    		isAnswered,
    		count,
    		allAnswers,
    		checkQuestion,
    		click_handler
    	};
    }

    class Question extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["question", "nextQuestion", "count"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Question", options, id: create_fragment.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.question === undefined && !('question' in props)) {
    			console.warn("<Question> was created without expected prop 'question'");
    		}
    		if (ctx.nextQuestion === undefined && !('nextQuestion' in props)) {
    			console.warn("<Question> was created without expected prop 'nextQuestion'");
    		}
    	}

    	get question() {
    		throw new Error("<Question>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set question(value) {
    		throw new Error("<Question>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nextQuestion() {
    		throw new Error("<Question>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nextQuestion(value) {
    		throw new Error("<Question>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get count() {
    		throw new Error("<Question>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set count(value) {
    		throw new Error("<Question>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Modal.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/Modal.svelte";

    function create_fragment$1(ctx) {
    	var div1, div0, button, t_1, div0_transition, div1_resize_listener, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			button = element("button");
    			button.textContent = "close";
    			t_1 = space();

    			if (default_slot) default_slot.c();
    			add_location(button, file$1, 23, 4, 616);

    			attr_dev(div0, "class", "modal svelte-t45nk0");
    			add_location(div0, file$1, 22, 2, 564);
    			add_render_callback(() => ctx.div1_resize_handler.call(div1));
    			attr_dev(div1, "class", "modal-bg svelte-t45nk0");
    			attr_dev(div1, "tansition:fade", "");
    			add_location(div1, file$1, 21, 0, 503);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div0_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, button);
    			append_dev(div0, t_1);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			div1_resize_listener = add_resize_listener(div1, ctx.div1_resize_handler.bind(div1));
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fly, { y: 200 }, true);
    				div0_transition.run(1);
    			});

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);

    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fly, { y: 200 }, false);
    			div0_transition.run(0);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			if (default_slot) default_slot.d(detaching);

    			if (detaching) {
    				if (div0_transition) div0_transition.end();
    			}

    			div1_resize_listener.cancel();
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	
      let w; //This will grab dom attribtues right from the client
      const dispatch = createEventDispatcher();

    	let { $$slots = {}, $$scope } = $$props;

    	const click_handler = () => {
    	        dispatch('close');
    	      };

    	function div1_resize_handler() {
    		w = this.clientWidth;
    		$$invalidate('w', w);
    	}

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('w' in $$props) $$invalidate('w', w = $$props.w);
    	};

    	return {
    		w,
    		dispatch,
    		click_handler,
    		div1_resize_handler,
    		$$slots,
    		$$scope
    	};
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Modal", options, id: create_fragment$1.name });
    	}
    }

    /* src/Quiz.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/Quiz.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.question = list[i];
    	child_ctx.index = i;
    	return child_ctx;
    }

    // (1:0) <script>   import { fade, blur, fly, slide, scale }
    function create_catch_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_catch_block.name, type: "catch", source: "(1:0) <script>   import { fade, blur, fly, slide, scale }", ctx });
    	return block;
    }

    // (61:4) {:then data}
    function create_then_block(ctx) {
    	var each_1_anchor, current;

    	let each_value = ctx.data.results;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.activeQuestion || changed.quiz || changed.nextQuestion) {
    				each_value = ctx.data.results;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach_dev(each_1_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_then_block.name, type: "then", source: "(61:4) {:then data}", ctx });
    	return block;
    }

    // (63:8) {#if index === activeQuestion}
    function create_if_block_1$1(ctx) {
    	var div, t, div_intro, div_outro, current;

    	var question = new Question({
    		props: {
    		question: ctx.question,
    		nextQuestion: ctx.nextQuestion
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			question.$$.fragment.c();
    			t = space();
    			attr_dev(div, "class", "fade-wrapper svelte-1hgpycz");
    			add_location(div, file$2, 63, 10, 1457);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(question, div, null);
    			append_dev(div, t);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var question_changes = {};
    			if (changed.quiz) question_changes.question = ctx.question;
    			question.$set(question_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(question.$$.fragment, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { x: 200 });
    				div_intro.start();
    			});

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(question.$$.fragment, local);
    			if (div_intro) div_intro.invalidate();

    			div_outro = create_out_transition(div, fly, { x: -200 });

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_component(question);

    			if (detaching) {
    				if (div_outro) div_outro.end();
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$1.name, type: "if", source: "(63:8) {#if index === activeQuestion}", ctx });
    	return block;
    }

    // (62:6) {#each data.results as question, index}
    function create_each_block$1(ctx) {
    	var if_block_anchor, current;

    	var if_block = (ctx.index === ctx.activeQuestion) && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.index === ctx.activeQuestion) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(62:6) {#each data.results as question, index}", ctx });
    	return block;
    }

    // (59:17)        loading     {:then data}
    function create_pending_block(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("loading");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_pending_block.name, type: "pending", source: "(59:17)        loading     {:then data}", ctx });
    	return block;
    }

    // (72:0) {#if isModalOpen}
    function create_if_block$1(ctx) {
    	var current;

    	var modal = new Modal({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	modal.$on("close", ctx.resetQuiz);

    	const block = {
    		c: function create() {
    			modal.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$1.name, type: "if", source: "(72:0) {#if isModalOpen}", ctx });
    	return block;
    }

    // (73:2) <Modal on:close={resetQuiz}>
    function create_default_slot(ctx) {
    	var h2, t1, p, t3, button, dispose;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "You Won";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Congratulations NERD!!!";
    			t3 = space();
    			button = element("button");
    			button.textContent = "Start Over";
    			add_location(h2, file$2, 73, 4, 1704);
    			add_location(p, file$2, 74, 4, 1725);
    			add_location(button, file$2, 75, 4, 1760);
    			dispose = listen_dev(button, "click", ctx.resetQuiz);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h2);
    				detach_dev(t1);
    				detach_dev(p);
    				detach_dev(t3);
    				detach_dev(button);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot.name, type: "slot", source: "(73:2) <Modal on:close={resetQuiz}>", ctx });
    	return block;
    }

    function create_fragment$2(ctx) {
    	var div1, h40, t0, t1, t2, h41, t3, t4, t5, button, t7, div0, promise, t8, if_block_anchor, current, dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 'data',
    		error: 'null',
    		blocks: [,,,]
    	};

    	handle_promise(promise = ctx.quiz, info);

    	var if_block = (ctx.isModalOpen) && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h40 = element("h4");
    			t0 = text("Score: ");
    			t1 = text(ctx.$score);
    			t2 = space();
    			h41 = element("h4");
    			t3 = text("Question ");
    			t4 = text(ctx.questionNumber);
    			t5 = space();
    			button = element("button");
    			button.textContent = "Start New Quiz";
    			t7 = space();
    			div0 = element("div");

    			info.block.c();

    			t8 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h40, "class", "svelte-1hgpycz");
    			add_location(h40, file$2, 54, 2, 1170);
    			attr_dev(h41, "class", "svelte-1hgpycz");
    			add_location(h41, file$2, 55, 2, 1197);
    			add_location(button, file$2, 56, 2, 1234);
    			attr_dev(div0, "class", "container svelte-1hgpycz");
    			add_location(div0, file$2, 57, 2, 1289);
    			add_location(div1, file$2, 53, 0, 1162);
    			dispose = listen_dev(button, "click", ctx.resetQuiz);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h40);
    			append_dev(h40, t0);
    			append_dev(h40, t1);
    			append_dev(div1, t2);
    			append_dev(div1, h41);
    			append_dev(h41, t3);
    			append_dev(h41, t4);
    			append_dev(div1, t5);
    			append_dev(div1, button);
    			append_dev(div1, t7);
    			append_dev(div1, div0);

    			info.block.m(div0, info.anchor = null);
    			info.mount = () => div0;
    			info.anchor = null;

    			insert_dev(target, t8, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if (!current || changed.$score) {
    				set_data_dev(t1, ctx.$score);
    			}

    			if (!current || changed.questionNumber) {
    				set_data_dev(t4, ctx.questionNumber);
    			}

    			info.ctx = ctx;

    			if (('quiz' in changed) && promise !== (promise = ctx.quiz) && handle_promise(promise, info)) ; else {
    				info.block.p(changed, assign(assign({}, ctx), info.resolved));
    			}

    			if (ctx.isModalOpen) {
    				if (!if_block) {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else transition_in(if_block, 1);
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			info.block.d();
    			info.token = null;
    			info = null;

    			if (detaching) {
    				detach_dev(t8);
    			}

    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    async function getQuiz() {
      const res = await fetch(
        "https://opentdb.com/api.php?amount=10&category=27&type=multiple"
      );
      const quiz = await res.json();
      return quiz;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $score;

    	validate_store(score, 'score');
    	component_subscribe($$self, score, $$value => { $score = $$value; $$invalidate('$score', $score); });

    	
      let activeQuestion = 0;
      let quiz = getQuiz();
      let isModalOpen = false;
      onMount(() => {});

      let pickAnswer = a => {
        if (answer === correctAnswer) {
          return (result = "Correct!");
          result = "Oops";
        }
      };
      function nextQuestion() {
        $$invalidate('activeQuestion', activeQuestion = activeQuestion + 1);
      }
      function resetQuiz() {
        $$invalidate('isModalOpen', isModalOpen = false);
        $$invalidate('activeQuestion', activeQuestion = 0);
        score.set(0);
        $$invalidate('quiz', quiz = getQuiz());
      }

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('activeQuestion' in $$props) $$invalidate('activeQuestion', activeQuestion = $$props.activeQuestion);
    		if ('quiz' in $$props) $$invalidate('quiz', quiz = $$props.quiz);
    		if ('isModalOpen' in $$props) $$invalidate('isModalOpen', isModalOpen = $$props.isModalOpen);
    		if ('pickAnswer' in $$props) pickAnswer = $$props.pickAnswer;
    		if ('$score' in $$props) score.set($score);
    		if ('questionNumber' in $$props) $$invalidate('questionNumber', questionNumber = $$props.questionNumber);
    	};

    	let questionNumber;

    	$$self.$$.update = ($$dirty = { $score: 1, activeQuestion: 1 }) => {
    		if ($$dirty.$score) { if ($score > 8) {
            //TODO Switch to an animation
            $$invalidate('isModalOpen', isModalOpen = true);
          } }
    		if ($$dirty.activeQuestion) { $$invalidate('questionNumber', questionNumber = activeQuestion + 1); }
    	};

    	return {
    		activeQuestion,
    		quiz,
    		isModalOpen,
    		nextQuestion,
    		resetQuiz,
    		$score,
    		questionNumber
    	};
    }

    class Quiz extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Quiz", options, id: create_fragment$2.name });
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    const file$3 = "src/App.svelte";

    function create_fragment$3(ctx) {
    	var h1, t_1, div, current;

    	var quiz = new Quiz({ $$inline: true });

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Animal Quiz";
    			t_1 = space();
    			div = element("div");
    			quiz.$$.fragment.c();
    			attr_dev(h1, "class", "svelte-1rjkjcv");
    			add_location(h1, file$3, 19, 0, 266);
    			attr_dev(div, "class", "svelte-1rjkjcv");
    			add_location(div, file$3, 20, 0, 287);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t_1, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(quiz, div, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(quiz.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(quiz.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h1);
    				detach_dev(t_1);
    				detach_dev(div);
    			}

    			destroy_component(quiz);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$3.name });
    	}
    }

    const app = new App({
      target: document.body,
      props: {
        name: 'world',
      },
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
