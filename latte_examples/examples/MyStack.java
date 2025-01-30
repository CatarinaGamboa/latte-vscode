import specification.Free;
import specification.Unique;
import specification.Borrowed;


public class MyStack {

    @Unique Node root;		
    
    public MyStack(@Free Node root) {
        this.root = root;
    }

    
    void push( @Free Object value) {	
        Node r;
        Node n;
        r = this.root;
        this.root = null;
        n = new Node(value, r);
        this.root = n;
    }




















    @Free Object pop (){
        Object value;

        if (this.root == null) {
            value = null;
        } else {
            Node r = root; 
            value = r.value; 
            Node n;
            n = r.next;
            r.next = null;
            r.value = null;
            this.root = n;
        }
        return value; 
    }
    
    public @Unique Object dequeue() {
        Node r = this.root;
        //r : alias(this.root)
        if (r == null || r.next == null) {
          // In an empty or single-element stack, dequeue and pop
          // are equivalent
          return pop();
        } else {
        
            // `this` and `this.root` are effectively alias, thus
            // we cannot pass `this.root` to `this.dequeue` without
            // doing a destructive read
            this.root = null;
            // r : unique
        
            Object value = dequeueHelper(r);
            // value : unique
        
            // Since `dequeue` only detaches the next node of the one
            // passed to it, it will never need to detach `root`, so
            // we can just restore it back to the original value.
            this.root = r;
            // r : alias(this.root)
        
            return value;
        }
    }
    
    private @Unique Object dequeueHelper(@Borrowed Node n) {
        // Look ahead two steps so that we can disconnect the *next*
        // node by mutating the node that will remain in the stack.
    
        Node nn = n.next;
        // nn : alias(n.next)
    
        if (nn.next == null) {
          n.next = null;
          // nn : unique
          
          Object value = nn.value;
          // value : alias(nn.value)
    
          nn.value = null;
          // value : unique
    
          return value;
        } else {
          return dequeueHelper(n.next);
        }
    }
}

/**
* Node class for the stack example
* Uses @Unique annotations to specify that the value and next fields are unique
* in the scope of the Node class
* 
*
*/
class Node {

@Unique Object value;
@Unique Node next;

/**
 * Constructor for the Node class using @Free value and next nodes
 * @param value
 * @param next
 */
public Node (@Free Object value, @Free Node next) {
    this.value = value;
    this.next = next;
}
}
