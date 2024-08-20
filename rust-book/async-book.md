## 1. 自定义`Future`
`Future` trait是rust异步程序的核心, `Future`是一个可以产生一个值(即使这个值可能是空值(`()`))

```rust
trait SimpleFuture{
    type Output;
    fn poll(&mut self, wake: fn()) -> Poll<Self::Output>;
}
```
`poll`函数尽可能驱动`future`完成。 如果 `future`完成, 它返回 `Poll::Ready(result)`。如果这个还未完成, 返回 `Poll::Pending`,当`Future`准备好继续的时候,重新安排 调用`wake()`函数。 当`wwake()`被调用后, 执行器驱动 `Future`再次调用 `poll`.

```rust
use std::task::Poll;

pub struct SocketRead<'a>{
    // TODO: Undefined Socket Structures
    socket: Socket<'a>,
}

impl SimpleFuture for SocketRead<'_>{
    type Output = Vec<u8>;
    fn poll(&mut self, wake: fn()) -> Poll<Self::Output>{
        if self.socket.has_data_to_read(){
            Poll::Ready(self.socket.read_buf())
        }else{
            self.socket.set_readable_callback(wake);
            Poll::Pending
        }
    }
}
```
该 `Future`模型允许将多个异步操作编排在一起，而不需要中间的分配。 一次运行多个 `futures`或者将 `futures`串在一起可以通过`allocation-free`机制实现.

```rust
/// 一个 `SimpleFuture` 可以并发运行两个其他的 `futures`.
///
/// 并发其实是通过在每个`future`中调用`poll`实现.
/// 可能是交错的
pub struct Join<FutureA, FutureB> {
    a: Option<FutureA>,
    b: Option<FutureB>,
}

impl<FutureA, FutureB> SimpleFuture for Join<FutureA, FutureB>
where
    FutureA: SimpleFuture<Output = ()>,
    FutureB: SimpleFuture<Output = ()>,
{
    type Output = ();
    fn poll(&mut self, wake: fn()) -> Poll<Self::Output> {
        let a = self.a.as_mut().unwrap();
        let b = self.b.as_mut().unwrap();
        if let Poll::Ready(()) = a.poll(wake) {
            self.a.take();
        };
        if let Poll::Ready(()) = b.poll(wake) {
            self.b.take();
        };
        if self.a.is_none() && self.b.is_none() {
            Poll::Ready(())
        } else {
            Poll::Pending
        }
    }
}
```
以上告诉我们多个任务是如何不需要单独分配并同时工作的，并允许更高效的异步程序。类似的，多个序列`futures`也可以按顺序运行.

```rust
pub struct AndThenFuture<FutureA, FutureB> {
    first: Option<FutureA>,
    second: FutureB,
}

impl<FutureA, FutureB> SimpleFuture for AndThenFuture<FutureA, FutureB>
where
    FutureA: SimpleFuture<Output = ()>,
    FutureB: SimpleFuture<Output = ()>,
{
    type Output = ();
    fn poll(&mut self, wake: fn()) -> Poll<Self::Output> {
        // 先执行 `first` field
        if let Some(first) = self.first.as_mut() {
            match first.poll(wake) {
                Poll::Ready(()) => self.first.take(),
                Poll::Pending => return Poll::Pending,
            };
        }
        // 再执行 `second` field
        self.second.poll(wake)
    }
}
```
以上的例子和我们演示了`Future` trait如何用于表达异步控制流，而不需要多个分配的对象和深层次的任务函数回调，随着基础的控制流已解决, 让我们谈论真正的 `Future` trai有什么不同:
```rust
trait Future{
    type Output;
    fn poll(
        // 将 `&mut self` 改成 `Pin<&mut self>` 
        self: Pin<&mut self>,
        // 将 `wake: fn()` 改成 `&mut Context<'_>`
        cx: &mut Context<'_>,
    ) -> Poll<Self::Output>;
}
```

## 2. 自定义 `Task`
### 2.1 Task由 `Waker`唤醒
`future`不能再第一时间完成是很常见的, 如果该情况发生, `future`需要被保证再次被`polled`以取得一些进展. 这就是 `Waker`类型要做的事。

每次 `future`被 `polled`后,它就被视为一个 `task`. `Task`是最顶级的 `futures`会被提交到执行器中.

`Waker`有一个 `wake`方法用来告诉执行器，与之关联的任务需要被唤醒。当 `.wake()`被调用后, 执行器就知道与该`Waker`相关的任务已经准备好了取得进步,然后该`future`就会被再次`polled`.

`Waker`也实现了 `Clone`，所以`Waker`可以被完全复制和存储.

让我们使用 `waker`来实现一个简单的 `time future`

### 实现 `Timer`

```rust

```

## 3. 自定义 `Executor`

## 4. TODO


```rust


```